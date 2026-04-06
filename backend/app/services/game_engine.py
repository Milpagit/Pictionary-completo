from __future__ import annotations

import random
import time
import unicodedata
import logging

from app.config import settings
from app.models.room import Room, RoomStatus, Round
from app.services import room_manager, word_bank
from app.services.timer import start_timer, cancel_timer
from app.ws.connection import manager as ws_manager

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Lowercase, strip, remove accents for comparison."""
    text = text.strip().lower()
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _generate_hint(word: str, reveal_count: int) -> str:
    """Generate a hint string with *reveal_count* letters revealed."""
    chars = list(word)
    indices = [i for i, c in enumerate(chars) if c.isalpha()]
    # Always reveal first letter
    revealed = {indices[0]} if indices else set()
    remaining = [i for i in indices[1:] if i not in revealed]
    random.shuffle(remaining)
    for i in remaining:
        if len(revealed) >= reveal_count:
            break
        revealed.add(i)

    return "".join(c if i in revealed or not c.isalpha() else "_" for i, c in enumerate(chars))


def _calculate_guesser_points(elapsed_seconds: float) -> int:
    points = max(100, int(500 - elapsed_seconds * 5))
    return points


async def start_game(room_code: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None or room.status != RoomStatus.WAITING:
        return
    if len(room.players) < settings.min_players:
        return

    player_ids = list(room.players.keys())
    random.shuffle(player_ids)

    room.status = RoomStatus.PLAYING
    room.turn_order = player_ids
    room.total_rounds = len(player_ids) * settings.rounds_per_player
    room.round_number = 0
    room.current_turn_index = 0

    # Reset scores
    for p in room.players.values():
        p.score = 0

    await room_manager.save_room(room)
    await ws_manager.broadcast_to_room(room_code, {
        "type": "game_started",
        "totalRounds": room.total_rounds,
        "turnOrder": room.turn_order,
    })

    await _next_turn(room_code)


async def _next_turn(room_code: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return

    if room.round_number >= room.total_rounds:
        await _end_game(room_code)
        return

    drawer_id = room.turn_order[room.current_turn_index]
    words = word_bank.get_word_choices(3)

    # Reset drawing flags
    for p in room.players.values():
        p.is_drawing = p.id == drawer_id
        p.has_guessed = False

    room.current_round = Round(
        number=room.round_number + 1,
        drawer_id=drawer_id,
        word_options=words,
    )
    await room_manager.save_room(room)

    # Send word options ONLY to the drawer
    await ws_manager.send_personal(room_code, drawer_id, {
        "type": "word_options",
        "words": words,
    })

    # Tell everyone a new turn is starting (waiting for word selection)
    await ws_manager.broadcast_to_room(room_code, {
        "type": "choosing_word",
        "drawerId": drawer_id,
        "round": room.current_round.number,
    })


async def select_word(room_code: str, player_id: str, word: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return
    if room.current_round.drawer_id != player_id:
        return
    if word not in room.current_round.word_options:
        return

    room.current_round.word = word
    room.current_round.start_time = time.time()
    room.current_round.word_options = []
    room.round_number += 1
    await room_manager.save_room(room)

    # Broadcast round start (word length only, not the word itself)
    await ws_manager.broadcast_to_room(room_code, {
        "type": "round_start",
        "drawerId": player_id,
        "wordLength": len(word),
        "round": room.current_round.number,
        "timeLeft": settings.round_time,
    })

    start_timer(room_code, settings.round_time, on_tick=_on_tick, on_finish=_on_timer_finish)


async def _on_tick(room_code: str, remaining: int) -> None:
    total = settings.round_time
    elapsed_pct = 1.0 - (remaining / total)

    room = await room_manager.get_room(room_code)
    if room is None or not room.current_round.word:
        return

    word = room.current_round.word
    hints_given = room.current_round.hints_given

    if elapsed_pct >= settings.hint_first_pct and hints_given == 0:
        hint = _generate_hint(word, 1)
        room.current_round.hints_given = 1
        await room_manager.save_room(room)
        await ws_manager.broadcast_to_room(room_code, {
            "type": "hint",
            "hint": hint,
        }, exclude=room.current_round.drawer_id)

    elif elapsed_pct >= (1.0 - settings.hint_second_pct) and hints_given == 1:
        alpha_count = sum(1 for c in word if c.isalpha())
        hint = _generate_hint(word, max(2, alpha_count // 2))
        room.current_round.hints_given = 2
        await room_manager.save_room(room)
        await ws_manager.broadcast_to_room(room_code, {
            "type": "hint",
            "hint": hint,
        }, exclude=room.current_round.drawer_id)


async def _on_timer_finish(room_code: str) -> None:
    await end_round(room_code)


async def handle_guess(room_code: str, player_id: str, text: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None or room.status != RoomStatus.PLAYING:
        return
    if room.current_round.drawer_id == player_id:
        return  # Painter can't guess
    if player_id in room.current_round.guessed_player_ids:
        return  # Already guessed

    word = room.current_round.word
    if not word:
        return

    if _normalize(text) == _normalize(word):
        # Correct guess!
        elapsed = time.time() - room.current_round.start_time
        guesser_points = _calculate_guesser_points(elapsed)
        painter_points = 100

        room.current_round.guessed_player_ids.append(player_id)
        player = room.players.get(player_id)
        if player:
            player.score += guesser_points
            player.has_guessed = True

        drawer = room.players.get(room.current_round.drawer_id)
        if drawer:
            drawer.score += painter_points

        await room_manager.save_room(room)

        await ws_manager.broadcast_to_room(room_code, {
            "type": "correct_guess",
            "playerId": player_id,
            "nickname": player.nickname if player else "",
            "points": guesser_points,
            "scores": {pid: p.score for pid, p in room.players.items()},
        })

        # Check if everyone guessed
        non_drawer_ids = [pid for pid in room.players if pid != room.current_round.drawer_id]
        if all(pid in room.current_round.guessed_player_ids for pid in non_drawer_ids):
            cancel_timer(room_code)
            await end_round(room_code)
    else:
        # Wrong guess - show in chat
        player = room.players.get(player_id)
        await ws_manager.broadcast_to_room(room_code, {
            "type": "guess_message",
            "playerId": player_id,
            "nickname": player.nickname if player else "???",
            "text": text,
        })


async def end_round(room_code: str) -> None:
    cancel_timer(room_code)
    room = await room_manager.get_room(room_code)
    if room is None:
        return

    await ws_manager.broadcast_to_room(room_code, {
        "type": "round_end",
        "word": room.current_round.word,
        "scores": {pid: p.score for pid, p in room.players.items()},
        "round": room.current_round.number,
    })

    # Advance turn
    room.current_turn_index += 1
    room.current_round = Round()
    await room_manager.save_room(room)

    # Wait a moment before next turn
    import asyncio
    await asyncio.sleep(5)
    await _next_turn(room_code)


async def _end_game(room_code: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return

    room.status = RoomStatus.FINISHED
    scores = {pid: p.score for pid, p in room.players.items()}
    winner_id = max(scores, key=scores.get) if scores else ""
    winner = room.players.get(winner_id)

    await room_manager.save_room(room)
    await ws_manager.broadcast_to_room(room_code, {
        "type": "game_end",
        "finalScores": scores,
        "winnerId": winner_id,
        "winnerNickname": winner.nickname if winner else "",
    })


async def handle_player_disconnect(room_code: str, player_id: str) -> None:
    room = await room_manager.get_room(room_code)
    if room is None:
        return

    # If the drawer disconnected during an active round, end the round
    if (
        room.status == RoomStatus.PLAYING
        and room.current_round.drawer_id == player_id
        and room.current_round.word
    ):
        cancel_timer(room_code)
        await end_round(room_code)
