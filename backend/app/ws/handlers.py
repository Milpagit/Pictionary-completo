from __future__ import annotations

import json
import logging

from fastapi import WebSocket

from app.services import game_engine, room_manager
from app.ws.connection import manager as ws_manager

logger = logging.getLogger(__name__)


async def handle_message(room_code: str, player_id: str, raw: str) -> None:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return

    msg_type = data.get("type")
    if not msg_type:
        return

    if msg_type == "start_game":
        await _handle_start_game(room_code, player_id)
    elif msg_type == "select_word":
        await _handle_select_word(room_code, player_id, data)
    elif msg_type == "draw":
        await _handle_draw(room_code, player_id, data)
    elif msg_type == "clear_canvas":
        await _handle_clear_canvas(room_code, player_id)
    elif msg_type == "guess":
        await _handle_guess(room_code, player_id, data)
    else:
        logger.warning("Unknown message type: %s", msg_type)


async def _handle_start_game(room_code: str, player_id: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return
    if room.host_id != player_id:
        await ws_manager.send_personal(room_code, player_id, {
            "type": "error",
            "message": "Solo el host puede iniciar la partida.",
        })
        return
    await game_engine.start_game(room_code)


async def _handle_select_word(room_code: str, player_id: str, data: dict) -> None:
    word = data.get("word", "")
    if not word:
        return
    await game_engine.select_word(room_code, player_id, word)


async def _handle_draw(room_code: str, player_id: str, data: dict) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return
    if room.current_round.drawer_id != player_id:
        return
    # Forward draw data to everyone except the painter
    await ws_manager.broadcast_to_room(room_code, {
        "type": "draw",
        "points": data.get("points", []),
        "color": data.get("color", "#000000"),
        "strokeWidth": data.get("strokeWidth", 3),
        "tool": data.get("tool", "pen"),
    }, exclude=player_id)


async def _handle_clear_canvas(room_code: str, player_id: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return
    if room.current_round.drawer_id != player_id:
        return
    await ws_manager.broadcast_to_room(room_code, {
        "type": "clear_canvas",
    }, exclude=player_id)


async def _handle_guess(room_code: str, player_id: str, data: dict) -> None:
    text = data.get("text", "").strip()
    if not text:
        return
    await game_engine.handle_guess(room_code, player_id, text)
