import { useEffect, useRef, useState } from 'react'
import { Alert, Platform, Switch, TextInput, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { setActiveList } from '@/core/list'
import { setNavActiveId } from '@/core/common'
import { useLibraryPage } from '@/core/library/page'
import {
  browseDirectory, clearCache, importEntries, initializeLibrary, removeAccount, saveAccount,
  setCacheLimit, useLibrary,
} from '@/core/library'
import type { DirectoryEntry, LibraryAccount } from '@/core/library/types'
import { supportedAudio } from '@/core/library/reference'
import Section from '../../components/Section'

const formatBytes = (n: number) => n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`
const confirm = (title: string, message: string) => new Promise<boolean>(resolve => Alert.alert(title, message, [{ text: '取消', style: 'cancel', onPress: () => { resolve(false) } }, { text: '确认', onPress: () => { resolve(true) } }], { cancelable: true, onDismiss: () => { resolve(false) } }))
const row = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginVertical: 6 }
const emptyAccount = { name: 'WebDAV', endpoint: 'https://', username: '', allowHTTP: false, directoryCache: true, audioCache: true }

function ActionButton({ title, onPress, disabled, id }: { title: string, onPress: () => void, disabled?: boolean, id?: string }) {
  const theme = useTheme()
  return <TouchableOpacity testID={id} accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={{ minHeight: 42, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 6, borderColor: theme['c-border-background'], marginRight: 8, marginBottom: 8, opacity: disabled ? 0.45 : 1 }}>
    <Text color={theme['c-button-font']} size={15}>{title}</Text>
  </TouchableOpacity>
}
function Field({ label, value, onChange, secure, disabled, id, numeric }: { label: string, value: string, onChange: (text: string) => void, secure?: boolean, disabled?: boolean, id?: string, numeric?: boolean }) {
  const theme = useTheme()
  return <View style={{ marginBottom: 12 }}><Text size={14}>{label}</Text><TextInput testID={id} accessibilityLabel={label} value={value} onChangeText={onChange}
    editable={!disabled} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false} keyboardType={numeric ? 'number-pad' : 'default'}
    style={{ minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, borderWidth: 1, borderRadius: 5, color: theme['c-font'], borderColor: theme['c-border-background'], marginTop: 5 }} /></View>
}
function Toggle({ title, value, onChange, disabled, id }: { title: string, value: boolean, onChange: (value: boolean) => void, disabled?: boolean, id?: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, marginBottom: 6 }}>
    <Text style={{ flex: 1, marginRight: 12 }} size={15}>{title}</Text><Switch testID={id} accessibilityLabel={title} value={value} disabled={disabled} onValueChange={onChange} />
  </View>
}

export default function WebDAVSettings() {
  const theme = useTheme(), library = useLibrary(), requested = useLibraryPage()
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const [editing, setEditing] = useState<Partial<LibraryAccount> | null>(null), [accountPassword, setAccountPassword] = useState(''), [passwordEdited, setPasswordEdited] = useState(false)
  const [accountId, setAccountId] = useState(''), [path, setPath] = useState(''), [entries, setEntries] = useState<DirectoryEntry[]>([]), [selected, setSelected] = useState<string[]>([])
  const [visibleCount, setVisibleCount] = useState(100), [directoryLoading, setDirectoryLoading] = useState(false), [limit, setLimit] = useState(String(library.configuration.audioLimitMB))
  const pendingDirectory = useRef<ReturnType<typeof browseDirectory>>(), directoryGeneration = useRef(0), mounted = useRef(true)
  const locked = busy || library.busy
  const targetListId = requested.screen === 'webdav' ? requested.listId : ''

  useEffect(() => {
    mounted.current = true
    void initializeLibrary().catch(error => { setMessage(String(error?.message ?? 'WebDAV初始化失败')) })
    return () => { mounted.current = false; pendingDirectory.current?.cancel() }
  }, [])
  useEffect(() => {
    setLimit(String(library.configuration.audioLimitMB))
    if (!accountId || !library.configuration.accounts.some(a => a.id === accountId)) {
      setAccountId(library.configuration.accounts[0]?.id ?? '')
      setPath('')
    }
  }, [library.configuration, accountId])

  const settleDirectory = async() => {
    const pending = pendingDirectory.current
    pendingDirectory.current = undefined
    directoryGeneration.current++
    pending?.cancel()
    if (pending) await pending.promise.catch(() => {})
    if (mounted.current) setDirectoryLoading(false)
  }
  const run = (task: () => Promise<void>) => {
    if (locked) return
    setBusy(true); setMessage('')
    void (async() => { await settleDirectory(); await task() })()
      .catch(error => { if (mounted.current) setMessage(String(error?.message ?? '操作失败')) })
      .finally(() => { if (mounted.current) setBusy(false) })
  }
  const loadDirectory = (force = false) => {
    pendingDirectory.current?.cancel()
    const generation = ++directoryGeneration.current
    if (!accountId) { setEntries([]); return }
    setDirectoryLoading(true); setSelected([]); setVisibleCount(100)
    const pending = browseDirectory(accountId, path, force)
    pendingDirectory.current = pending
    void pending.promise.then(data => { if (mounted.current && generation === directoryGeneration.current) setEntries(data) })
      .catch(error => { if (mounted.current && generation === directoryGeneration.current) { setEntries([]); setMessage(String(error?.message ?? '目录读取失败')) } })
      .finally(() => { if (mounted.current && generation === directoryGeneration.current) setDirectoryLoading(false) })
  }
  useEffect(() => { loadDirectory() }, [accountId, path])

  if (Platform.OS !== 'ios') return null
  const accountButtons = <View style={row}>{library.configuration.accounts.map(a => <ActionButton key={a.id} title={`${accountId === a.id ? '已选：' : ''}${a.name}`} disabled={locked} onPress={() => { setAccountId(a.id); setPath('') }} />)}</View>

  return <Section title="WebDAV">
    <View testID="webdav-settings" style={{ marginBottom: 24 }}>
      <Text size={13}>统一管理WebDAV连接、目录缓存和音频缓存。下载与备份只引用这里已保存的账户，不重复保存服务器参数。</Text>
      {library.error ? <Text testID="library-error">错误：{library.error}</Text> : null}
      {message ? <Text testID="library-message" selectable style={{ marginVertical: 8 }}>{message}</Text> : null}
      {accountButtons}
      <View style={row}><ActionButton title="添加账户" id="library-account-add" disabled={locked} onPress={() => { setEditing({ ...emptyAccount }); setAccountPassword(''); setPasswordEdited(true) }} />
        <ActionButton title="编辑当前账户" disabled={locked || !accountId} onPress={() => { setEditing({ ...library.configuration.accounts.find(a => a.id === accountId) }); setAccountPassword(''); setPasswordEdited(false) }} />
        <ActionButton title="删除当前账户" disabled={locked || !accountId} onPress={() => { run(async() => { if (await confirm('删除WebDAV账户', '删除保存的连接和密码，不删除服务器文件或歌单。已导入歌曲在账户重新配置前将无法读取。')) await removeAccount(accountId) }) }} /></View>
      {editing ? <View testID="library-account-editor" style={{ padding: 12, borderWidth: 1, borderColor: theme['c-border-background'], marginBottom: 12 }}>
        <Field label="账户名称" value={editing.name ?? ''} onChange={name => { setEditing({ ...editing, name }) }} disabled={locked} />
        <Field id="library-account-endpoint" label="WebDAV根目录完整地址" value={editing.endpoint ?? ''} onChange={endpoint => { setEditing({ ...editing, endpoint }) }} disabled={locked} />
        <Field label="用户名" value={editing.username ?? ''} onChange={username => { setEditing({ ...editing, username }) }} disabled={locked} />
        <Field id="library-account-password" label={editing.id ? '密码（不修改则保留已存密码）' : '密码（匿名可为空）'} value={accountPassword} secure onChange={value => { setAccountPassword(value); setPasswordEdited(true) }} disabled={locked} />
        <Toggle title="允许明文HTTP（仅可信局域网）" value={!!editing.allowHTTP} onChange={allowHTTP => { setEditing({ ...editing, allowHTTP }) }} disabled={locked} />
        <Toggle id="library-directory-cache" title="缓存目录5分钟，减少服务器目录请求" value={!!editing.directoryCache} onChange={directoryCache => { setEditing({ ...editing, directoryCache }) }} disabled={locked} />
        <Toggle id="library-audio-cache" title="保留已验证音频缓存，重复播放降低服务器流量" value={!!editing.audioCache} onChange={audioCache => { setEditing({ ...editing, audioCache }) }} disabled={locked} />
        <Text size={13}>目录缓存与音频缓存独立控制；关闭音频缓存后，播放时重新读取音频数据。</Text>
        <View style={row}><ActionButton title="保存账户" id="library-account-save" disabled={locked} onPress={() => { run(async() => {
          const value = await saveAccount({ ...editing, ...(passwordEdited ? { password: accountPassword } : {}) })
          setAccountPassword(''); setEditing(null); setAccountId(editing.id ?? value.accounts[value.accounts.length - 1].id); setMessage('账户已保存；可用强制刷新验证连接。')
        }) }} /><ActionButton title="取消编辑" disabled={locked} onPress={() => { setEditing(null); setAccountPassword('') }} /></View>
      </View> : null}
      <Field label="音频缓存上限（MB，0表示不读写音频缓存）" value={limit} numeric onChange={setLimit} disabled={locked} />
      <View style={row}><ActionButton title="保存缓存上限" disabled={locked} onPress={() => { run(async() => { await setCacheLimit(Number(limit)); setMessage('缓存上限已保存。') }) }} />
        <ActionButton title="清除目录缓存" disabled={locked} onPress={() => { run(async() => { await clearCache('directory'); setMessage('目录缓存已清除。') }) }} />
        <ActionButton title="清除音频缓存" disabled={locked} onPress={() => { run(async() => { await clearCache('audio'); setMessage('音频缓存已清除；已下载文件不受影响。') }) }} /></View>
      <Text selectable size={15}>目录：/{path}</Text>
      <View style={row}><ActionButton title="上一级" disabled={locked || directoryLoading || !path} onPress={() => { setPath(path.split('/').slice(0, -1).join('/')) }} />
        <ActionButton title={directoryLoading ? '读取中…' : '强制刷新 / 测试连接'} id="library-directory-refresh" disabled={locked || directoryLoading || !accountId} onPress={() => { loadDirectory(true) }} />
        <ActionButton title="全选当前目录音频" disabled={locked || directoryLoading} onPress={() => { setSelected(entries.filter(e => !e.directory && supportedAudio(e.name)).map(e => e.path)) }} /></View>
      {entries.slice(0, visibleCount).map(entry => <TouchableOpacity key={entry.path} accessibilityRole="button" accessibilityLabel={`${entry.directory ? '打开文件夹' : '选择文件'} ${entry.name}`}
        onPress={() => { if (locked) return; if (entry.directory) setPath(entry.path); else if (supportedAudio(entry.name)) setSelected(current => current.includes(entry.path) ? current.filter(p => p !== entry.path) : [...current, entry.path]) }}
        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme['c-border-background'] }}>
        <Text size={15}>{entry.directory ? '目录 / ' : selected.includes(entry.path) ? '已选 / ' : ''}{entry.name}</Text>
        {!entry.directory && entry.size != null ? <Text size={12}>{formatBytes(entry.size)}</Text> : null}
      </TouchableOpacity>)}
      {visibleCount < entries.length ? <ActionButton title={`显示更多（共${entries.length}项）`} onPress={() => { setVisibleCount(v => v + 100) }} /> : null}
      {!directoryLoading && accountId && entries.length === 0 ? <Text>当前目录没有可显示条目。</Text> : null}
      {targetListId ? <View testID="webdav-import-to-list" style={{ marginTop: 14 }}>
        <Text>从“我的列表”进入：已选{selected.length}首，将添加到当前列表。</Text>
        <View style={row}><ActionButton id="library-import" title="添加到当前歌单" disabled={locked || !selected.length || !accountId} onPress={() => { run(async() => {
          const result = await importEntries(accountId, entries.filter(e => selected.includes(e.path)), targetListId)
          setSelected([]); setMessage(`已添加${result.count}首。`)
        }) }} /><ActionButton title="返回我的列表" onPress={() => { setActiveList(targetListId); setNavActiveId('nav_love') }} /></View>
      </View> : <Text size={13} style={{ marginTop: 14 }}>需要把WebDAV歌曲加入歌单时，请从“我的列表 → 从 WebDAV 添加”进入；新建歌单仍只在“我的列表”完成。</Text>}
    </View>
  </Section>
}
