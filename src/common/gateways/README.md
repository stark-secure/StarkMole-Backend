# Real-Time WebSocket API

**URL:** `ws://<host>/realtime`
**Auth:** JWT via `auth.token` in handshake

## Events

- `leaderboard:update`
  **Payload:** `{ leaderboardId, scores: [...] }`

- `game:state-change`
  **Payload:** `{ gameId, state: 'started'|'paused'|'ended' }`

- `notification:alert`
  **Payload:** `{ message, type }`

## Subscriptions

- `leaderboard:subscribe` `{ leaderboardId }`
- `game:subscribe` `{ gameId }`

## Sample Client

```js
import { io } from "socket.io-client";
const socket = io('ws://localhost:3000/realtime', {
  auth: { token: 'JWT_TOKEN' }
});
socket.emit('leaderboard:subscribe', { leaderboardId: 'abc' });
socket.on('leaderboard:update', (data) => { console.log(data); });
``` 