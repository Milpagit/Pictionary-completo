from __future__ import annotations

import json
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by room code.

    Guarantees broadcasting isolation: messages in room X never leak to room Y.
    """

    def __init__(self) -> None:
        # room_code -> {player_id -> WebSocket}
        self._rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, room_code: str, player_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if room_code not in self._rooms:
            self._rooms[room_code] = {}
        self._rooms[room_code][player_id] = ws
        logger.info("WS connected: room=%s player=%s", room_code, player_id)

    def disconnect(self, room_code: str, player_id: str) -> None:
        room = self._rooms.get(room_code)
        if room and player_id in room:
            del room[player_id]
            if not room:
                del self._rooms[room_code]
        logger.info("WS disconnected: room=%s player=%s", room_code, player_id)

    async def send_personal(self, room_code: str, player_id: str, message: dict) -> None:
        room = self._rooms.get(room_code, {})
        ws = room.get(player_id)
        if ws:
            await ws.send_text(json.dumps(message))

    async def broadcast_to_room(
        self,
        room_code: str,
        message: dict,
        exclude: str | None = None,
    ) -> None:
        room = self._rooms.get(room_code, {})
        data = json.dumps(message)
        for pid, ws in list(room.items()):
            if pid == exclude:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                logger.warning("Failed to send to player %s in room %s", pid, room_code)

    def player_count(self, room_code: str) -> int:
        return len(self._rooms.get(room_code, {}))

    def get_room_player_ids(self, room_code: str) -> list[str]:
        return list(self._rooms.get(room_code, {}).keys())


manager = ConnectionManager()
