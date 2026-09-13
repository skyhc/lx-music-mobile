import handleAuth from './auth'
import { connect as socketConnect, disconnect as socketDisconnect, sendSyncStatus } from './client'
import { parseUrl } from './utils'
import { SYNC_CODE } from '../constants'
import { removeSyncModeEvent } from '@/core/sync'

let connectId = 0
export const connectServer = async(host: string, authCode?: string) => {
  const id = ++connectId
  removeSyncModeEvent()
  await socketDisconnect()
  if (id != connectId) return
  sendSyncStatus({ status: false, message: SYNC_CODE.connecting })
  try {
    const url = parseUrl(host)
    const key = await handleAuth(url, authCode?.trim())
    if (id != connectId) return
    socketConnect(url, key)
  } catch (error: any) {
    if (id != connectId) return
    sendSyncStatus({ status: false, message: error?.message || SYNC_CODE.connectServiceFailed })
    throw error
  }
}
export const disconnectServer = async(isResetStatus = true) => {
  ++connectId
  removeSyncModeEvent()
  await socketDisconnect()
  if (isResetStatus) sendSyncStatus({ status: false, message: '' })
}
export { getStatus, hasClientConnection } from './client'
