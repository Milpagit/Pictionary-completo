from __future__ import annotations

import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services import room_manager, game_engine
from app.ws.connection import manager as ws_manager
from app.ws.handlers import handle_message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pictionary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/rooms")
async def create_room(body: dict):
    nickname = body.get("nickname", "").strip()
    if not nickname:
        return {"error": "Nickname is required"}, 400
    room, player = await room_manager.create_room(nickname)
    return {
        "roomCode": room.code,
        "playerId": player.id,
        "hostId": room.host_id,
    }


@app.get("/rooms/{code}")
async def get_room(code: str):
    room = await room_manager.get_room(code)
    if room is None:
        return {"error": "Room not found"}, 404
    return {
        "roomCode": room.code,
        "hostId": room.host_id,
        "players": {pid: {"nickname": p.nickname, "score": p.score} for pid, p in room.players.items()},
        "status": room.status.value,
    }


@app.websocket("/ws/{room_code}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, nickname: str):
    # Try to join the room
    result = await room_manager.join_room(room_code, nickname)
    if result is None:
        # Room might not exist or is full — check if player is reconnecting via existing room
        room = await room_manager.get_room(room_code)
        if room is None:
            await websocket.close(code=4004, reason="Room not found")
            return
        # Room exists but is full or playing
        await websocket.close(code=4003, reason="Cannot join room")
        return

    room, player = result
    player_id = player.id

    await ws_manager.connect(room_code, player_id, websocket)

    # Broadcast player joined
    await ws_manager.broadcast_to_room(room_code, {
        "type": "player_joined",
        "player": {"id": player.id, "nickname": player.nickname, "score": player.score},
        "players": {pid: {"id": pid, "nickname": p.nickname, "score": p.score} for pid, p in room.players.items()},
        "hostId": room.host_id,
    }, exclude=player_id)

    # Send room state to the joining player
    await ws_manager.send_personal(room_code, player_id, {
        "type": "room_state",
        "roomCode": room.code,
        "playerId": player_id,
        "hostId": room.host_id,
        "players": {pid: {"id": pid, "nickname": p.nickname, "score": p.score} for pid, p in room.players.items()},
        "status": room.status.value,
    })

    try:
        while True:
            raw = await websocket.receive_text()
            await handle_message(room_code, player_id, raw)
    except WebSocketDisconnect:
        logger.info("Player %s disconnected from room %s", player_id, room_code)
    finally:
        ws_manager.disconnect(room_code, player_id)
        updated_room = await room_manager.leave_room(room_code, player_id)

        if updated_room:
            await ws_manager.broadcast_to_room(room_code, {
                "type": "player_left",
                "playerId": player_id,
                "hostId": updated_room.host_id,
                "players": {
                    pid: {"id": pid, "nickname": p.nickname, "score": p.score}
                    for pid, p in updated_room.players.items()
                },
            })
            await game_engine.handle_player_disconnect(room_code, player_id)
