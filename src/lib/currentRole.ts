/**
 * Module-level biến lưu role_id hiện tại.
 * Dùng để apiClient có thể đọc role mà không tạo circular dependency
 * với useAuthStore (vì useAuthStore → apiClient đã tồn tại).
 */
let _roleId: number | undefined = undefined

export const currentRole = {
  get: (): number | undefined => _roleId,
  set: (id: number | undefined): void => {
    _roleId = id
  },
}
