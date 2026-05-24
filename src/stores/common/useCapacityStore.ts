import { create } from 'zustand'
import type { CapacityState, CapacityRealtimePayload } from '@/types/api'
import {
  connectCapacitySocket,
  disconnectCapacitySocket,
  subscribeCapacitySSE,
  closeCapacitySSE,
  getCapacitySocketStatus,
  type WSStatus,
} from '@/service/capacityRealtimeService'
import capacityService from '@/service/capacityService'

// Track recent alerts per spot_id to suppress duplicate notifications
const ALERT_DEBOUNCE_MS = 30_000
const recentAlerts: Map<string, number> = new Map()

interface CapacityStoreState {
  capacityBySpotId: Record<string, CapacityState>
  isLoading: boolean
  wsStatus: WSStatus

  /** Load REST snapshot — call before opening realtime connection */
  loadSnapshot: () => Promise<void>

  /** Update a single spot's capacity from a realtime event */
  updateCapacityBySpotId: (spotId: string, payload: Pick<CapacityState, 'visitor_count' | 'capacity_pct' | 'status' | 'recorded_at'>) => void

  /** Connect WebSocket (admin — requires auth token) */
  connectWS: () => void

  /** Disconnect WebSocket */
  disconnectWS: () => void

  /** Subscribe SSE (public — no auth required) */
  connectSSE: () => void

  /** Close SSE */
  disconnectSSE: () => void

  /** Sync wsStatus from the service */
  syncWSStatus: () => void
}

export const useCapacityStore = create<CapacityStoreState>((set, get) => ({
  capacityBySpotId: {},
  isLoading: false,
  wsStatus: 'disconnected',

  loadSnapshot: async () => {
    set({ isLoading: true })
    try {
      const res = await capacityService.getCurrent()
      const items: CapacityState[] = Array.isArray(res?.data?.capacity) ? res.data!.capacity : []
      const byId: Record<string, CapacityState> = {}
      for (const item of items) byId[item.spot_id] = item
      set({ capacityBySpotId: byId })
    } catch {
      // Snapshot failure is non-fatal — realtime will fill in data
    } finally {
      set({ isLoading: false })
    }
  },

  updateCapacityBySpotId: (spotId, payload) => {
    set((state) => ({
      capacityBySpotId: {
        ...state.capacityBySpotId,
        [spotId]: {
          ...(state.capacityBySpotId[spotId] ?? { spot_id: spotId, max_capacity: null, alert_threshold_pct: null }),
          ...payload,
        },
      },
    }))
  },

  connectWS: () => {
    const { updateCapacityBySpotId } = get()

    connectCapacitySocket({
      onUpdate: (payload: CapacityRealtimePayload) => {
        updateCapacityBySpotId(payload.spot_id, {
          visitor_count: payload.visitor_count,
          capacity_pct: payload.capacity_pct,
          status: payload.status,
          recorded_at: payload.recorded_at,
        })
        set({ wsStatus: getCapacitySocketStatus() })
      },

      onAlert: (payload: CapacityRealtimePayload) => {
        updateCapacityBySpotId(payload.spot_id, {
          visitor_count: payload.visitor_count,
          capacity_pct: payload.capacity_pct,
          status: payload.status,
          recorded_at: payload.recorded_at,
        })
        set({ wsStatus: getCapacitySocketStatus() })

        // Debounce alert toasts per spot_id
        const now = Date.now()
        const last = recentAlerts.get(payload.spot_id) ?? 0
        if (now - last > ALERT_DEBOUNCE_MS) {
          recentAlerts.set(payload.spot_id, now)
          // Toast import kept local to avoid circular deps — caller can also listen onAlert
        }
      },

      onConnected: () => set({ wsStatus: 'connected' }),
      onDisconnected: () => set({ wsStatus: 'reconnecting' }),
    })
    set({ wsStatus: getCapacitySocketStatus() })
  },

  disconnectWS: () => {
    disconnectCapacitySocket()
    set({ wsStatus: 'disconnected' })
  },

  connectSSE: () => {
    const { updateCapacityBySpotId } = get()

    subscribeCapacitySSE({
      onUpdate: (payload) => {
        updateCapacityBySpotId(payload.spot_id, {
          visitor_count: payload.visitor_count,
          capacity_pct: payload.capacity_pct,
          status: payload.status,
          recorded_at: payload.recorded_at,
        })
      },
      onAlert: (payload) => {
        updateCapacityBySpotId(payload.spot_id, {
          visitor_count: payload.visitor_count,
          capacity_pct: payload.capacity_pct,
          status: payload.status,
          recorded_at: payload.recorded_at,
        })
        const now = Date.now()
        const last = recentAlerts.get(payload.spot_id) ?? 0
        if (now - last > ALERT_DEBOUNCE_MS) {
          recentAlerts.set(payload.spot_id, now)
        }
      },
    })
  },

  disconnectSSE: () => {
    closeCapacitySSE()
  },

  syncWSStatus: () => {
    set({ wsStatus: getCapacitySocketStatus() })
  },
}))

export default useCapacityStore
