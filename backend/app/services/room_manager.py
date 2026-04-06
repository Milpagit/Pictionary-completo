from __future__ import annotations

import json
import random
import string
import logging

import redis.asyncio as aioredis

from app.config import settings
from app.models.room import Player, Room, RoomStatus

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _room_key(code: str) -> str:
    return f"room:{code}"


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def create_room(nickname: str) -> tuple[Room, Player]:
    r = await get_redis()
    code = _generate_code()
    # Ensure unique code
    while await r.exists(_room_key(code)):
        code = _generate_code()

    player = Player(nickname=nickname)
    room = Room(code=code, host_id=player.id)
    room.players[player.id] = player

    await r.set(_room_key(code), room.model_dump_json())
    logger.info("Room created: %s by %s", code, nickname)
    return room, player


async def get_room(code: str) -> Room | None:
    r = await get_redis()
    data = await r.get(_room_key(code))
    if data is None:
        return None
    return Room.model_validate_json(data)


async def save_room(room: Room) -> None:
    r = await get_redis()
    await r.set(_room_key(room.code), room.model_dump_json())


async def join_room(code: str, nickname: str) -> tuple[Room, Player] | None:
    room = await get_room(code)
    if room is None:
        return None
    if room.status != RoomStatus.WAITING:
        return None
    if len(room.players) >= settings.max_players:
        return None

    player = Player(nickname=nickname)
    room.players[player.id] = player
    await save_room(room)
    logger.info("Player %s joined room %s", nickname, code)
    return room, player


async def leave_room(code: str, player_id: str) -> Room | None:
    room = await get_room(code)
    if room is None:
        return None
    room.players.pop(player_id, None)

    if not room.players:
        r = await get_redis()
        await r.delete(_room_key(code))
        logger.info("Room %s deleted (empty)", code)
        return None

    # Transfer host if needed
    if room.host_id == player_id:
        room.host_id = next(iter(room.players))

    await save_room(room)
    return room


async def delete_room(code: str) -> None:
    r = await get_redis()
    await r.delete(_room_key(code))
