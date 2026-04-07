# Pictionary Online

Juego multijugador de dibujo y adivinanzas en tiempo real, construido con **FastAPI** + **WebSockets** en el backend y **Next.js 19** en el frontend, usando **Redis** como almacenamiento de estado compartido.

---

## Características

- Salas con código único y soporte para hasta 8 jugadores
- Turnos rotativos: cada jugador dibuja una vez por ronda
- El dibujante elige entre 3 palabras al inicio de su turno
- Temporizador configurable por ronda con pistas automáticas (letras reveladas)
- Puntuación dinámica según velocidad de respuesta
- Canvas colaborativo en tiempo real (Konva)
- Chat integrado con detección de respuesta correcta

---

## Tecnologías

| Capa      | Tecnología                                |
| --------- | ----------------------------------------- |
| Backend   | Python 3.12, FastAPI, Uvicorn, WebSockets |
| Estado    | Redis 7                                   |
| Frontend  | Next.js 16, React 19, TypeScript          |
| Canvas    | Konva / react-konva                       |
| Estado UI | Zustand                                   |
| Estilos   | Tailwind CSS 4                            |
| Infra     | Docker Compose                            |

---

## Estructura del proyecto

```
Pictionary/
├── backend/
│   ├── app/
│   │   ├── config.py          # Configuración via variables de entorno
│   │   ├── main.py            # Endpoints HTTP y WebSocket
│   │   ├── models/            # Modelos Pydantic (Room, Player, Round)
│   │   ├── services/          # Lógica de negocio (game_engine, room_manager, timer)
│   │   ├── words/             # Banco de palabras por idioma (es.json)
│   │   └── ws/                # Gestión de conexiones y handlers WS
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/               # Rutas Next.js (App Router)
│       ├── components/        # Canvas, Chat, Lobby, PlayerList, etc.
│       ├── hooks/             # useWebSocket
│       ├── lib/               # Tipos TypeScript
│       └── store/             # gameStore (Zustand)
└── docker-compose.yml
```

---

## Inicio rápido

### 1. Requisitos previos

- Docker y Docker Compose
- Node.js 20+
- Python 3.12+

### 2. Levantar Redis

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # ajusta los valores si es necesario
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # ajusta los valores si es necesario
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable            | Por defecto                 | Descripción                                    |
| ------------------- | --------------------------- | ---------------------------------------------- |
| `REDIS_URL`         | `redis://localhost:6379/0`  | URL de conexión a Redis                        |
| `CORS_ORIGINS`      | `["http://localhost:3000"]` | Orígenes permitidos (JSON array)               |
| `ROUND_TIME`        | `60`                        | Duración en segundos por turno                 |
| `MAX_PLAYERS`       | `8`                         | Máximo de jugadores por sala                   |
| `MIN_PLAYERS`       | `2`                         | Mínimo para iniciar partida                    |
| `ROUNDS_PER_PLAYER` | `1`                         | Rondas que dibuja cada jugador                 |
| `HINT_FIRST_PCT`    | `0.50`                      | % del tiempo al que se revela la primera pista |
| `HINT_SECOND_PCT`   | `0.25`                      | % restante al que se revela la segunda pista   |

### Frontend (`frontend/.env.local`)

| Variable              | Por defecto             | Descripción                    |
| --------------------- | ----------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL base de la API del backend |

---

## Flujo de juego

```
Lobby (esperando jugadores)
  └─► Host inicia partida
        └─► Turno: dibujante elige palabra (3 opciones, 15 s)
              └─► Ronda activa: resto adivina en el chat
                    ├─► Pistas automáticas al 50% y 25% del tiempo restante
                    ├─► Puntos al adivinar (más puntos si es rápido)
                    └─► Fin de ronda → siguiente turno → ... → Marcador final
```

---

## Licencia

MIT
