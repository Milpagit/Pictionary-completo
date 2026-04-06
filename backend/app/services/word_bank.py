from __future__ import annotations

import json
import random
from pathlib import Path


_WORDS: dict[str, list[str]] = {}


def _load_words() -> None:
    global _WORDS
    if _WORDS:
        return
    path = Path(__file__).resolve().parent.parent / "words" / "es.json"
    with open(path, encoding="utf-8") as f:
        _WORDS = json.load(f)


def get_word_choices(count: int = 3) -> list[str]:
    """Return *count* random words from different categories when possible."""
    _load_words()
    categories = list(_WORDS.keys())
    chosen: list[str] = []
    used_cats: set[str] = set()

    while len(chosen) < count:
        available_cats = [c for c in categories if c not in used_cats] or categories
        cat = random.choice(available_cats)
        used_cats.add(cat)
        word = random.choice(_WORDS[cat])
        if word not in chosen:
            chosen.append(word)

    return chosen


def get_all_words() -> list[str]:
    _load_words()
    return [w for words in _WORDS.values() for w in words]
