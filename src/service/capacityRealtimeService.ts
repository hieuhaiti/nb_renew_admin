import { tokenManager } from '@/lib/tokenManager'
import type { CapacityRealtimePayload, CapacitySSEMessage, CapacityWSMessage } from '@/types/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ─── SSE ──────────────────────────────────────────────────────────────────────

export interface SSEOptions {
  onUpdate: (payload: CapacityRealtimePayload) => void
  onAlert: (payload: CapacityRealtimePayload) => void
  onError?: (err: Event) => void
}

interface SSEConnection {
  close: () => void
}

let sseInstance: EventSource | null = null
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null
let sseReconnectAttempts = 0
const SSE_MAX_BACKOFF_MS = 30_000

/**
 * Subscribe to capacity SSE stream (public — no auth token required).
 * Returns a handle with close(). Prevents duplicate connections.
 */
/** GET /capacity/stream */
export function subscribeCapacitySSE(options: SSEOptions): SSEConnection {
  if (sseInstance) {
    // Already connected — re-use
    return { close: closeCapacitySSE }
  }

  const url = `${API_BASE}/capacity/stream`

  function connect() {
    sseInstance = new EventSource(url)

    sseInstance.onmessage = (event) => {
      try {
        const msg: CapacitySSEMessage = JSON.parse(event.data)
        const payload = msg.data ?? (msg as unknown as CapacityRealtimePayload)
        if (payload.type === 'capacity_update' || payload.type === 'capacity_alert') {
          if (payload.type === 'capacity_alert') {
            options.onAlert(payload)
          } else {
            options.onUpdate(payload)
          }
        }
      } catch {
        // Ignore malformed messages
      }
    }

    sseInstance.onerror = (err) => {
      options.onError?.(err)
      sseInstance?.close()
      sseInstance = null

      // Exponential backoff reconnect
      const delay = Math.min(1_000 * 2 ** sseReconnectAttempts, SSE_MAX_BACKOFF_MS)
      sseReconnectAttempts += 1
      sseReconnectTimer = setTimeout(connect, delay)
    }

    sseInstance.onopen = () => {
      sseReconnectAttempts = 0
    }
  }

  connect()
  return { close: closeCapacitySSE }
}

export function closeCapacitySSE(): void {
  if (sseReconnectTimer !== null) {
    clearTimeout(sseReconnectTimer)
    sseReconnectTimer = null
  }
  sseInstance?.close()
  sseInstance = null
  sseReconnectAttempts = 0
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export interface WSOptions {
  onUpdate: (payload: CapacityRealtimePayload) => void
  onAlert: (payload: CapacityRealtimePayload) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (err: Event) => void
}

export type WSStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

let wsInstance: WebSocket | null = null
let wsOptions: WSOptions | null = null
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
let wsReconnectAttempts = 0
let wsStatus: WSStatus = 'disconnected'
const WS_MAX_BACKOFF_MS = 30_000

export function getCapacitySocketStatus(): WSStatus {
  return wsStatus
}

/**
 * Connect to the WebSocket capacity channel.
 * Uses access_token from tokenManager — must NOT be called before login.
 * Protocol is determined automatically: HTTPS frontend → wss://, HTTP → ws://.
 */
export function connectCapacitySocket(opts: WSOptions): void {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsOptions = opts
    return
  }

  const token = tokenManager.getAccessToken()
  if (!token) {
    console.warn('[capacityRealtime] No access token — cannot connect WebSocket')
    return
  }

  wsOptions = opts
  wsStatus = 'connecting'
  const url = `${import.meta.env.VITE_WS_URL}?token=${encodeURIComponent(token)}`

  function connect() {
    const ws = new WebSocket(url)
    wsInstance = ws

    ws.onopen = () => {
      // Guard: if this socket was superseded (disconnect was called), do nothing
      if (wsInstance !== ws) return

      wsStatus = 'connected'
      wsReconnectAttempts = 0
      wsOptions?.onConnected?.()

      // Subscribe to capacity channel
      ws.send(JSON.stringify({ action: 'subscribe', channels: ['capacity'] }))
    }

    ws.onmessage = (event) => {
      if (wsInstance !== ws) return
      try {
        const msg: CapacityWSMessage = JSON.parse(event.data as string)
        if (msg.event !== 'capacity_update' && msg.event !== 'capacity_alert') return

        const payload = msg.data
        if (payload.type === 'capacity_alert') {
          wsOptions?.onAlert(payload)
        } else {
          wsOptions?.onUpdate(payload)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onerror = (err) => {
      if (wsInstance !== ws) return
      wsOptions?.onError?.(err)
    }

    ws.onclose = () => {
      if (wsInstance !== ws) return
      wsStatus = 'reconnecting'
      wsOptions?.onDisconnected?.()
      wsInstance = null

      const delay = Math.min(1_000 * 2 ** wsReconnectAttempts, WS_MAX_BACKOFF_MS)
      wsReconnectAttempts += 1
      wsReconnectTimer = setTimeout(() => {
        // Re-read token in case it was refreshed
        const newToken = tokenManager.getAccessToken()
        if (!newToken || !wsOptions) {
          wsStatus = 'disconnected'
          return
        }
        connect()
      }, delay)
    }
  }

  connect()
}

export function disconnectCapacitySocket(): void {
  if (wsReconnectTimer !== null) {
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = null
  }
  wsInstance?.close()
  wsInstance = null
  wsOptions = null
  wsReconnectAttempts = 0
  wsStatus = 'disconnected'
}
