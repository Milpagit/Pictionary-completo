from __future__ import annotations

import asyncio
import logging

from app.ws.connection import manager as ws_manager

logger = logging.getLogger(__name__)

# room_code -> asyncio.Task
_timers: dict[str, asyncio.Task] = {}


async def _countdown(room_code: str, seconds: int, on_tick: callable, on_finish: callable) -> None:
    try:
        for remaining in range(seconds, -1, -1):
            await ws_manager.broadcast_to_room(room_code, {
                "type": "time_update",
                "timeLeft": remaining,
            })
            if on_tick:
                await on_tick(room_code, remaining)
            if remaining > 0:
                await asyncio.sleep(1)
        await on_finish(room_code)
    except asyncio.CancelledError:
        logger.info("Timer cancelled for room %s", room_code)


def start_timer(room_code: str, seconds: int, on_tick: callable = None, on_finish: callable = None) -> None:
    cancel_timer(room_code)
    task = asyncio.create_task(_countdown(room_code, seconds, on_tick, on_finish))
    _timers[room_code] = task


def cancel_timer(room_code: str) -> None:
    task = _timers.pop(room_code, None)
    if task and not task.done():
        task.cancel()
