/**
 * CSYNC 页面桥接（fork 自上游 1.0.3 的 inject-web-api，已启用 syncArticle）。
 * 全局仍暴露为 window.$pluginSyncer，与 md 发布逻辑中的命名一致。
 */

;(function () {
  'use strict'

  if (window.$pluginSyncer && typeof window.$pluginSyncer._cleanup === 'function') {
    window.$pluginSyncer._cleanup()
  }

  const VERSION = '1.0.4-csync'
  const CHANNEL_INIT_SOURCE = 'plugin-syncer-channel-init'

  const ErrorCode = Object.freeze({
    NOT_CONNECTED: 'NOT_CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    INVALID_PARAMS: 'INVALID_PARAMS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  })

  function createError(message, code) {
    const err = new Error(message)
    err.code = code
    return err
  }

  let port = null
  let connected = false
  const pendingCalls = new Map()
  let eventCounter = 0
  let _syncStatusHandler = null
  const disconnectListeners = new Set()

  function generateEventId() {
    return `evt_${Date.now()}_${++eventCounter}`
  }

  function onPortMessage(event) {
    const msg = event.data
    if (!msg || typeof msg !== 'object')
      return

    if (msg.callReturn && msg.eventID) {
      const entry = pendingCalls.get(msg.eventID)
      if (entry) {
        pendingCalls.delete(msg.eventID)
        if (msg.error) {
          entry.reject(createError(msg.error, msg.errorCode || ErrorCode.INTERNAL_ERROR))
        }
        else {
          entry.resolve(msg.data)
        }
      }
      return
    }

    if (msg.method === 'EXTENSION_INVALIDATED') {
      teardown()
      return
    }

    if (msg.method === 'syncUpdate' && _syncStatusHandler) {
      _syncStatusHandler(msg.task)
    }
  }

  function teardown() {
    if (!connected && !port)
      return
    connected = false

    if (port) {
      try { port.close() }
      catch { /* ignore */ }
      port = null
    }

    pendingCalls.forEach((entry) => {
      entry.reject(createError('Extension disconnected', ErrorCode.DISCONNECTED))
    })
    pendingCalls.clear()
    _syncStatusHandler = null

    disconnectListeners.forEach((fn) => {
      try { fn() }
      catch { /* ignore */ }
    })

    try { delete window.$pluginSyncer }
    catch { /* ignore */ }

    window.removeEventListener('message', onChannelInit)
  }

  function onChannelInit(event) {
    if (
      !event.data
      || event.data.source !== CHANNEL_INIT_SOURCE
      || !event.ports
      || !event.ports[0]
    ) {
      return
    }

    if (port) {
      try { port.close() }
      catch { /* ignore */ }
    }
    pendingCalls.forEach((entry) => {
      entry.reject(createError('Extension reconnected — old calls discarded', ErrorCode.DISCONNECTED))
    })
    pendingCalls.clear()

    port = event.ports[0]
    connected = true

    port.onmessage = onPortMessage
    port.onmessageerror = function () {
      teardown()
    }

    console.log('[CSYNC] $pluginSyncer MessageChannel connected')

    if (!window.$pluginSyncer) {
      exposeGlobal()
    }
  }

  window.addEventListener('message', onChannelInit)

  function ensureConnected() {
    if (!connected || !port) {
      return createError('Extension not connected', ErrorCode.NOT_CONNECTED)
    }
    return null
  }

  function sendCall(method, data) {
    return new Promise((resolve, reject) => {
      const connErr = ensureConnected()
      if (connErr) {
        reject(connErr)
        return
      }
      const eventId = generateEventId()
      pendingCalls.set(eventId, { resolve, reject })

      try {
        port.postMessage(Object.assign({ method, eventID: eventId }, data || {}))
      }
      catch {
        pendingCalls.delete(eventId)
        teardown()
        reject(createError('Extension disconnected', ErrorCode.DISCONNECTED))
      }
    })
  }

  function getPlatforms() {
    return sendCall('getPlatforms')
  }

  function syncArticle(task, statusHandler) {
    const connErr = ensureConnected()
    if (connErr)
      return Promise.reject(connErr)

    if (!task || !task.post || !task.platforms) {
      return Promise.reject(
        createError('task must include post and platforms', ErrorCode.INVALID_PARAMS),
      )
    }

    _syncStatusHandler = statusHandler || null
    return sendCall('syncArticle', { task })
  }

  function openSyncPanel(articleData) {
    return sendCall('openSyncPanel', { article: articleData })
  }

  function onDisconnect(fn) {
    if (typeof fn === 'function')
      disconnectListeners.add(fn)
  }

  function offDisconnect(fn) {
    disconnectListeners.delete(fn)
  }

  function cleanup() {
    teardown()
  }

  function exposeGlobal() {
    const api = {
      version: VERSION,
      get connected() { return connected },
      ErrorCode,
      getPlatforms,
      syncArticle,
      openSyncPanel,
      onDisconnect,
      offDisconnect,
      _cleanup: cleanup,
    }

    Object.defineProperty(window, '$pluginSyncer', {
      value: api,
      writable: false,
      configurable: true,
      enumerable: true,
    })
  }

  exposeGlobal()

  console.log(`[CSYNC] $pluginSyncer API ready (${VERSION}), waiting for channel…`)
})()
