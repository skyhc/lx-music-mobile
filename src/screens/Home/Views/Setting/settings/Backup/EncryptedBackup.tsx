import { useEffect, useState } from 'react'
import { Alert, Platform, Switch, TextInput, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { selectFile } from '@/utils/fs'
import { shareFile } from '@/utils/nativeModules/utils'
import {
  armRestore, browseDirectory, cancelRestore, createEncryptedBackup, downloadQueue, fetchBackup,
  initializeLibrary, restoreStatus, stageEncryptedRestore, uploadBackup, useLibrary,
} from '@/core/library'
import type { BackupFile, DirectoryEntry, RestoreStatus, TransferProgress } from '@/core/library/types'
import { openLibrarySettings } from '@/core/library/page'
import SubTitle from '../../components/SubTitle'

const formatBytes = (n: number) => n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`
const statusName: Record<string, string> = { encrypting: '加密', decrypting: '解密', uploading: '上传', downloading: '下载', verifying: '校验' }
const confirm = (title: string, message: string) => new Promise<boolean>(resolve => Alert.alert(title, message, [{ text: '取消', style: 'cancel', onPress: () => { resolve(false) } }, { text: '确认', onPress: () => { resolve(true) } }], { cancelable: true, onDismiss: () => { resolve(false) } }))
const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginVertical: 6 }

function ActionButton({ title, onPress, disabled, id }: { title: string, onPress: () => void, disabled?: boolean, id?: string }) {
  const theme = useTheme()
  return <TouchableOpacity testID={id} accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={{ minHeight: 42, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 6, borderColor: theme['c-border-background'], marginRight: 8, marginBottom: 8, opacity: disabled ? 0.45 : 1 }}>
    <Text color={theme['c-button-font']} size={15}>{title}</Text>
  </TouchableOpacity>
}
function Field({ label, value, onChange, secure, disabled, id }: { label: string, value: string, onChange: (text: string) => void, secure?: boolean, disabled?: boolean, id?: string }) {
  const theme = useTheme()
  return <View style={{ marginBottom: 12 }}><Text size={14}>{label}</Text><TextInput testID={id} accessibilityLabel={label} value={value} onChangeText={onChange}
    editable={!disabled} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false}
    style={{ minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, borderWidth: 1, borderRadius: 5, color: theme['c-font'], borderColor: theme['c-border-background'], marginTop: 5 }} /></View>
}

export default function EncryptedBackup() {
  const library = useLibrary()
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [progress, setProgress] = useState<TransferProgress>()
  const [accountId, setAccountId] = useState(''), [backupFolder, setBackupFolder] = useState('LX Backups')
  const [backupKind, setBackupKind] = useState<'full' | 'playlists'>('full'), [includeCaches, setIncludeCaches] = useState(true)
  const [password, setPassword] = useState(''), [passwordAgain, setPasswordAgain] = useState('')
  const [backup, setBackup] = useState<BackupFile>(), [restore, setRestore] = useState<RestoreStatus>()
  const [restorePath, setRestorePath] = useState(''), [backupEntries, setBackupEntries] = useState<DirectoryEntry[]>([])
  const locked = busy || library.busy

  useEffect(() => {
    void initializeLibrary().then(() => restoreStatus()).then(setRestore).catch(error => { setMessage(String(error?.message ?? '备份模块初始化失败')) })
  }, [])
  useEffect(() => {
    if (!accountId || !library.configuration.accounts.some(a => a.id === accountId)) setAccountId(library.configuration.accounts[0]?.id ?? '')
  }, [library.configuration, accountId])
  const run = (task: () => Promise<void>) => {
    if (locked) return
    setBusy(true); setMessage(''); setProgress(undefined)
    void task().catch(error => { setMessage(String(error?.message ?? '操作失败')) }).finally(() => { setBusy(false) })
  }
  if (Platform.OS !== 'ios') return null
  const accountButtons = <View style={row}>{library.configuration.accounts.map(a => <ActionButton key={a.id} title={`${accountId === a.id ? '已选：' : ''}${a.name}`} disabled={locked} onPress={() => { setAccountId(a.id); setBackupEntries([]) }} />)}</View>

  return <SubTitle title="加密备份与恢复">
    <View testID="encrypted-backup-settings" style={{ paddingLeft: 10, paddingRight: 10, marginBottom: 20 }}>
      {message ? <Text testID="library-message" selectable style={{ marginVertical: 8 }}>{message}</Text> : null}
      {progress ? <Text testID="library-progress">{statusName[progress.phase] ?? progress.phase}：{formatBytes(progress.received)}{progress.total > 0 ? ` / ${formatBytes(progress.total)}` : ''}</Text> : null}
      <Text size={15}>备份类型</Text>
      <View style={row}><ActionButton title={`${backupKind === 'full' ? '已选：' : ''}完整软件数据`} disabled={locked} onPress={() => { setBackupKind('full') }} /><ActionButton title={`${backupKind === 'playlists' ? '已选：' : ''}全部歌单`} disabled={locked} onPress={() => { setBackupKind('playlists') }} /></View>
      <Text size={13}>完整备份包含应用Documents、Application Support、设置、用户音源、歌单、已下载文件、下载记录及WebDAV凭据；可选包含Library/Caches。歌单备份只替换歌单范围并保留其他设置。</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 }}><Text style={{ flex: 1 }}>完整备份包含Library/Caches缓存文件</Text><Switch value={includeCaches} disabled={locked || backupKind !== 'full'} onValueChange={setIncludeCaches} /></View>
      <Field id="library-backup-password" label="备份 / 恢复密码（至少10个字符，不会保存）" value={password} secure onChange={setPassword} disabled={locked} />
      <Field label="再次输入密码（创建备份时必填）" value={passwordAgain} secure onChange={setPasswordAgain} disabled={locked} />
      <Text size={13}>密码用于PBKDF2派生及AES-GCM加密。忘记密码不能恢复。上传到WebDAV时只发送加密备份文件。</Text>
      <ActionButton id="library-backup-create" title="创建加密备份" disabled={locked} onPress={() => { run(async() => {
        if (password.length < 10 || password !== passwordAgain) throw new Error('请填写至少10个字符且两次一致的密码')
        const result = await createEncryptedBackup(backupKind, password, includeCaches, setProgress)
        setBackup(result); setPassword(''); setPasswordAgain(''); setMessage('加密备份已生成；可导出到本机或上传到WebDAV。')
      }) }} />
      {backup ? <View><Text selectable>{backup.name} · {formatBytes(backup.size)}</Text><Text selectable size={12}>SHA256：{backup.sha256}</Text>
        <ActionButton title="导出加密备份文件" disabled={locked} onPress={() => { run(async() => { await shareFile(backup.name, backup.path) }) }} /></View> : null}

      <Text size={15} style={{ marginTop: 12 }}>WebDAV备份位置</Text>
      {accountButtons}
      {library.configuration.accounts.length === 0 ? <Text size={13}>尚未配置WebDAV账户。</Text> : null}
      <ActionButton title="管理统一WebDAV配置" disabled={locked} onPress={() => { openLibrarySettings('webdav') }} />
      <Field label="WebDAV备份目录（相对账户根目录）" value={backupFolder} onChange={setBackupFolder} disabled={locked} />
      <View style={row}><ActionButton title="上传刚创建的备份" disabled={locked || !accountId || !backup} onPress={() => { run(async() => { await uploadBackup(backup!.path, accountId, backupFolder, setProgress).promise; setMessage('服务器读回校验通过，加密备份已上传。') }) }} />
        <ActionButton title="查看WebDAV备份" disabled={locked || !accountId} onPress={() => { run(async() => { const data = await browseDirectory(accountId, backupFolder, true).promise; setBackupEntries(data.filter(e => !e.directory && e.name.toLowerCase().endsWith('.lxbackup'))) }) }} /></View>
      {backupEntries.map(entry => <ActionButton key={entry.path} title={`选择恢复：${entry.name}`} disabled={locked} onPress={() => { run(async() => { const result = await fetchBackup(accountId, entry.path, setProgress).promise; setRestorePath(result.path); setMessage('备份已下载到应用；输入密码后先解密检查。') }) }} />)}

      <Text size={15} style={{ marginTop: 12 }}>恢复</Text>
      <ActionButton title="选择本地加密备份" disabled={locked} onPress={() => { run(async() => { const file = await selectFile({ extTypes: ['lxbackup'] }); setRestorePath(file.path); setMessage('已选择备份，尚未修改当前软件数据。') }) }} />
      <Text selectable size={12}>待检查文件：{restorePath.split('/').pop() || '未选择'}</Text>
      <ActionButton id="library-restore-stage" title="解密并检查备份（暂不替换）" disabled={locked || !restorePath} onPress={() => { run(async() => {
        const result = await stageEncryptedRestore(restorePath, password, setProgress)
        setRestore(result); setPassword(''); setPasswordAgain(''); setMessage('解密、版本及文件校验通过；确认恢复后，下次冷启动才替换数据。')
      }) }} />
      {restore && restore.state !== 'none' ? <View testID="library-restore-status"><Text size={15}>{restore.message}</Text>
        <Text size={13}>{restore.kind === 'full' ? '完整数据' : restore.kind === 'playlists' ? '歌单' : ''}{restore.files != null ? ` · ${restore.files}个文件` : ''}{restore.bytes != null ? ` · ${formatBytes(restore.bytes)}` : ''}</Text>
        {restore.state === 'prepared' ? <ActionButton id="library-restore-arm" title="确认在下次冷启动恢复" disabled={locked} onPress={() => { run(async() => {
          if (await confirm('替换软件数据', '恢复将替换备份范围内的数据。原数据保留到首次成功启动；启动验证失败则下次启动回滚。确认后请从后台关闭并重新打开应用，不要卸载。')) { await downloadQueue.pauseAll(); setRestore(await armRestore(restore.id!)); setMessage('已安排恢复。请从后台关闭后重新打开应用，不要卸载。') }
        }) }} /> : null}
        {['prepared', 'ready'].includes(restore.state) ? <ActionButton title="取消待恢复事务" disabled={locked} onPress={() => { run(async() => { await cancelRestore(restore.id!); setRestore(await restoreStatus()); setMessage('已取消，原软件数据未替换。') }) }} /> : null}
      </View> : null}
    </View>
  </SubTitle>
}
