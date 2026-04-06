from __future__ import annotations

import uuid
from enum import Enum

from pydantic import BaseModel, Field


class RoomStatus(str, Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"


class Player(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    nickname: str
    score: int = 0
    is_drawing: bool = False
    has_guessed: bool = False


class Round(BaseModel):
    number: int = 0
    drawer_id: str = ""
    word: str = ""
    word_options: list[str] = Field(default_factory=list)
    guessed_player_ids: list[str] = Field(default_factory=list)
    start_time: float = 0.0
    hints_given: int = 0


class Room(BaseModel):
    code: str
    host_id: str = ""
    players: dict[str, Player] = Field(default_factory=dict)
    status: RoomStatus = RoomStatus.WAITING
    current_round: Round = Field(default_factory=Round)
    round_number: int = 0
    total_rounds: int = 0
    turn_order: list[str] = Field(default_factory=list)
    current_turn_index: int = 0
