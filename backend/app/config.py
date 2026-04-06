from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    round_time: int = 60
    max_players: int = 8
    min_players: int = 2
    rounds_per_player: int = 1
    hint_first_pct: float = 0.50
    hint_second_pct: float = 0.25
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
