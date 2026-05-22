# Capacity Realtime FE Integration

Tai lieu nay huong dan frontend/mobile nhan cap nhat cong suat tai diem du lich theo thoi gian thuc.

## Muc Tieu

- Khi nha quan ly cap nhat cong suat tai qua backend, user dang mo app nhan du lieu moi ngay.
- Man hinh ban do, danh sach va chi tiet diem du lich tu cap nhat `visitor_count`, `capacity_pct`, `status`, `recorded_at`.
- User khong can reload app.

## API Snapshot Ban Dau

Dung API REST de lay trang thai hien tai truoc khi mo realtime connection.

```http
GET /api/v1/capacity/current
GET /api/v1/capacity/current/geojson
```

Goi y:

- Man hinh danh sach: dung `/capacity/current`.
- Man hinh ban do: dung `/capacity/current/geojson`.
- Man hinh chi tiet: dung snapshot hien co cua spot, hoac map theo `spot_id` tu `/capacity/current`.

## Kenh Realtime

Backend ho tro 2 kenh realtime cho capacity.

### SSE Public

Nen dung cho tourist map/list public vi khong can token.

```http
GET /api/v1/capacity/stream
```

Client se nhan cac message dang Server-Sent Events.

### WebSocket

Dung khi app da co `access_token` hoac dashboard can dung chung realtime channel.

```text
WS /ws?token=<access_token>
```

Sau khi connect, subscribe channel `capacity`:

```json
{
  "action": "subscribe",
  "channels": ["capacity"]
}
```

## Su Kien Can Xu Ly

### `capacity_update`

Duoc phat sau khi manager/admin ghi nhan cong suat moi qua:

```http
POST /api/v1/capacity/spots/:spotId/log
```

Payload:

```json
{
  "event": "capacity_update",
  "data": {
    "type": "capacity_update",
    "spot_id": "...",
    "visitor_count": 120,
    "capacity_pct": "60.00",
    "status": "busy",
    "recorded_at": "2026-05-10T..."
  },
  "timestamp": "2026-05-10T..."
}
```

FE can:

- Tim item theo `spot_id`.
- Cap nhat `visitor_count`, `capacity_pct`, `status`, `recorded_at`.
- Neu dang o map, cap nhat marker/layer tuong ung.
- Neu dang o chi tiet spot, cap nhat badge/trang thai cong suat ngay.

### `capacity_alert`

Duoc phat khi diem du lich gan day hoac qua tai.

Payload:

```json
{
  "event": "capacity_alert",
  "data": {
    "type": "capacity_alert",
    "spot_id": "...",
    "status": "near_full",
    "capacity_pct": "90.00",
    "visitor_count": 180,
    "recorded_at": "2026-05-10T..."
  },
  "timestamp": "2026-05-10T..."
}
```

Gia tri `status` co the la:

- `near_full`
- `overloaded`

FE can:

- Cap nhat state capacity giong `capacity_update`.
- Hien thi canh bao nhe neu user dang xem spot do, hoac spot nam trong vung ban do hien tai.
- Khong spam thong bao neu nhan nhieu alert lien tiep cho cung mot `spot_id`.

## Luong Trien Khai De Xuat

1. Khi vao man hinh map/list/detail, goi REST snapshot.
2. Luu capacity theo map key `spot_id`.
3. Mo SSE hoac WebSocket.
4. Khi nhan realtime event, merge payload vao state hien tai theo `spot_id`.
5. Re-render marker/list item/detail badge.
6. Tu reconnect khi mat ket noi.
7. Cleanup connection khi roi man hinh neu connection chi dung rieng cho man hinh do.

## Goi Y Chon Kenh

| Use case | Kenh nen dung |
|---|---|
| Tourist public map/list | SSE `/api/v1/capacity/stream` |
| App da dang nhap | WebSocket `/ws?token=<access_token>` |
| Admin/dashboard realtime | WebSocket channel `capacity` |
| Can fallback don gian | REST snapshot + SSE |

## Acceptance Criteria

- Mo app o man hinh ban do hoac danh sach.
- Manager/admin cap nhat cong suat bang API log capacity.
- Trong vong 1-2 giay, app user tu cap nhat so khach, phan tram tai va trang thai.
- Khong can refresh app.
- Khong tao nhieu connection trung lap khi chuyen man hinh.
- Connection tu reconnect sau khi mat mang hoac backend restart.

## Vi Du SSE

```js
const source = new EventSource(`${API_BASE_URL}/api/v1/capacity/stream`);

source.onmessage = (event) => {
  const payload = JSON.parse(event.data);

  if (payload.type === 'capacity_update' || payload.type === 'capacity_alert') {
    updateCapacityBySpotId(payload.spot_id, {
      visitor_count: payload.visitor_count,
      capacity_pct: payload.capacity_pct,
      status: payload.status,
      recorded_at: payload.recorded_at,
    });
  }
};

source.onerror = () => {
  source.close();
  // Reconnect theo backoff cua app.
};
```

## Vi Du WebSocket

```js
const socket = new WebSocket(`${WS_BASE_URL}/ws?token=${accessToken}`);

socket.onopen = () => {
  socket.send(JSON.stringify({
    action: 'subscribe',
    channels: ['capacity'],
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.event !== 'capacity_update' && message.event !== 'capacity_alert') {
    return;
  }

  const payload = message.data;
  updateCapacityBySpotId(payload.spot_id, {
    visitor_count: payload.visitor_count,
    capacity_pct: payload.capacity_pct,
    status: payload.status,
    recorded_at: payload.recorded_at,
  });
};

socket.onclose = () => {
  // Reconnect theo backoff cua app.
};
```
