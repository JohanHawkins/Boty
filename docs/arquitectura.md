# Arquitectura de Boty

Documento de referencia de la estructura y el flujo actual del proyecto.

## Vista general

```
Frontend (React + Vite + TS)          Backend (Express + TS)
┌─────────────────────────────┐      ┌──────────────────────────────────────┐
│ ChatPage                    │      │ routes/  → controllers/ → services/  │
│  ├─ useChat (estado)        │      │   /api/chat  chat.ts        llm.ts   │
│  ├─ Chat                    │ ───▶ │   /api/auth  auth.ts        intent.ts│
│  │   ├─ Message (+options)  │ POST │   /health            config/ (.env)  │
│  │   └─ ChatInput           │      │                    models/ → db/pool │
└─────────────────────────────┘      │ middleware/ (error, logger)          │
                ▲                    └───────────────┬──────────────────────┘
                └────────────── respuesta JSON ◀─────┘
                                            PostgreSQL (tabla users)
```

## Flujo de un mensaje (modo demo)

1. El usuario escribe un mensaje o pulsa una **opción seleccionable**.
2. `useChat` guarda el mensaje del usuario y lo envía a `POST /api/chat` con el historial completo.
3. `controllers/chat.ts` valida la entrada y delega en `services/llm.ts`.
4. En modo demo (`LLM_MODE=demo`), `llm.ts` consulta `services/intent.ts`:
   - Normaliza el texto (minúsculas, sin tildes, sin puntuación).
   - Lo tokeniza y lo compara contra el banco de palabras clave.
   - Si hay coincidencia, usa la respuesta (y opciones) de la intención; si no, usa la respuesta por defecto.
5. El backend responde `{ role, content, options? }`.
6. El frontend renderiza la respuesta; si incluye `options`, las muestra como botones.

## Estructura de carpetas

### Frontend (`frontend/src/`)

| Carpeta      | Contenido                                                        |
| ------------ | ---------------------------------------------------------------- |
| `assets/`    | `global.css` (variables y estilos del chat)                      |
| `components/`| `Chat.tsx`, `ChatInput.tsx`, `Message.tsx` (botones de opciones) |
| `pages/`     | `ChatPage.tsx` (vista principal)                                 |
| `hooks/`     | `useChat.ts` (estado de mensajes, envío y limpieza)              |
| `services/`  | `api.ts` (llamadas a `POST /api/chat`)                           |
| `types/`     | `chat.ts` (`ChatMessage`, roles, `options`)                      |

### Backend (`backend/src/`)

| Carpeta        | Contenido                                                          |
| -------------- | ------------------------------------------------------------------ |
| `config/`      | `index.ts` (variables de entorno: puerto, BD, LLM)                 |
| `controllers/` | `chat.ts` (validación del request y respuesta), `auth.ts` (registro)|
| `db/`          | `index.ts` (pool de PostgreSQL + `initDb`)                         |
| `middleware/`  | `error.ts` (`HttpError`, handlers), `logger.ts`                    |
| `models/`      | `user.ts` (acceso a la tabla `users`)                              |
| `routes/`      | `chat.ts`, `auth.ts`, `health.ts`                                  |
| `services/`    | `llm.ts` (modo demo/live), `intent.ts`, `auth.ts` (hash + registro)|
| `utils/`       | `asyncHandler.ts`                                                  |

## Registro de usuarios

El flujo de registro se apoya en una tabla `users` en PostgreSQL (creada automáticamente en el arranque por `initDb`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

* `services/auth.ts` hashea la contraseña con **scrypt** (sal aleatoria por usuario, `salt:hash` en hex).
* `models/user.ts` expone `createUser` y `findUserByUsername`.
* `POST /api/auth/register` recibe `{ username, password }` y responde `201` con los datos del usuario (sin la contraseña).
* La conexión es opcional: si la BD no está disponible, el servidor arranca igual y solo fallan las operaciones que la usan.

## Contratos de API

### `POST /api/chat`

Body:

```json
{
  "messages": [{ "role": "user", "content": "Hola" }]
}
```

Respuesta (200):

```json
{
  "role": "assistant",
  "content": "¡Hola! soy Boty, ...",
  "options": ["Gestion de Correos y Contraseñas", "Recordatorios", "Guardar informacion"]
}
```

> `options` es opcional: solo aparece cuando el bot ofrece opciones seleccionables.

### `GET /health`

```json
{ "status": "ok", "uptime": 123.45 }
```

### `POST /api/auth/register`

Body:

```json
{ "username": "ana", "password": "1234" }
```

Respuesta (201):

```json
{ "id": 1, "username": "ana", "createdAt": "2026-01-01T00:00:00.000Z" }
```

Errores: `400` (campos faltantes o inválidos), `409` (username en uso).

## Cómo extender

* **Nueva intención en modo demo**: agrega una entrada a `intentBank` en `services/intent.ts` (palabras clave + respuesta + opciones opcionales).
* **Conectar un LLM real**: configura `LLM_MODE=live` y las variables `LLM_API_KEY`/`LLM_MODEL`/`LLM_API_URL` en `backend/.env`.
* **Autenticación (siguiente paso)**: emitir un JWT tras el registro/login y proteger los endpoints; luego persistir conversaciones y mensajes asociados al usuario.
