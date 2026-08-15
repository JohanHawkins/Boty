# Arquitectura de Boty

Documento de referencia de la estructura y el flujo actual del proyecto.

## Vista general

```
Frontend (React + Vite + TS)          Backend (Express + TS)
┌─────────────────────────────┐      ┌──────────────────────────────────────┐
│ ChatPage                    │      │ routes/  → controllers/ → services/  │
│  ├─ useChat (estado)        │      │   /api/chat  chat.ts        llm.ts   │
│  ├─ Chat                    │ ───▶ │   /health    (validación)  intent.ts │
│  │   ├─ Message (+options)  │  POST│                      config/ (.env)  │
│  │   └─ ChatInput           │      │ middleware/ (error, logger)          │
└─────────────────────────────┘      └──────────────────────────────────────┘
                ▲                                     │
                └────────────── respuesta JSON ◀──────┘
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
| `config/`      | `index.ts` (variables de entorno: puerto, LLM)                     |
| `controllers/` | `chat.ts` (validación del request y respuesta)                     |
| `middleware/`  | `error.ts` (`HttpError`, handlers), `logger.ts`                    |
| `routes/`      | `chat.ts` (`POST /api/chat`), `health.ts` (`GET /health`)          |
| `services/`    | `llm.ts` (modo demo/live), `intent.ts` (detección de intenciones)  |
| `utils/`       | `asyncHandler.ts`                                                  |

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

## Cómo extender

* **Nueva intención en modo demo**: agrega una entrada a `intentBank` en `services/intent.ts` (palabras clave + respuesta + opciones opcionales).
* **Conectar un LLM real**: configura `LLM_MODE=live` y las variables `LLM_API_KEY`/`LLM_MODEL`/`LLM_API_URL` en `backend/.env`.
* **Persistencia (siguiente paso)**: agregar PostgreSQL con modelos Usuarios/Conversaciones/Mensajes y reemplazar el historial en memoria del frontend por el historial del backend.
