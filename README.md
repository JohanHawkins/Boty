# Boty

Boty es un chatbot construido desde el **Nivel Medio (aplicación funcional con persistencia)** pero con mentalidad de MVP, pensado para evolucionar hacia agentes, memoria avanzada y automatización. La hoja de ruta completa está en [`ideas.txt`](ideas.txt).

Actualmente **ya funciona** un chat completo: frontend de chat con historial por sesión, backend Express, integración LLM compatible con OpenAI y un **modo demo sin API key** con opciones seleccionables.

## Características

* Chat UI en React + Vite + TypeScript (`Chat`, `ChatInput`, `Message`)
* Backend Node.js + Express + TypeScript (rutas/controllers/services/middleware)
* `POST /api/chat` (REST) con historial de conversación en memoria (contexto de sesión)
* `GET /health`
* `POST /api/auth/register` para crear usuarios (hash scrypt de la contraseña, sin clave en texto plano)
* **Persistencia PostgreSQL** (tabla `users`) mediante `pg`, con conexión opcional: si la BD no está disponible, el modo demo sigue funcionando
* Integración LLM vía API compatible con OpenAI, configurable por `.env` (`LLM_API_KEY`, `LLM_MODEL`, `LLM_API_URL`); compatible también con Ollama local
* **Modo demo sin API key** (`LLM_MODE=demo`): respuestas por intenciones, con **3 opciones seleccionables** en el saludo que se envían como mensaje del usuario al pulsarlas
* Detección de intenciones centralizada (tokenización + banco de palabras, insensible a mayúsculas y tildes) en `services/intent.ts`
* Manejo de errores (`HttpError`, error handler), logs y validación de entrada
* Pruebas unitarias con Vitest (`tests/chat.test.ts`, `tests/llm.test.ts`, `tests/intent.test.ts`)
* Arquitectura cliente-servidor con Vite proxy en desarrollo

## Stack Tecnológico

| Capa      | Tecnología                              |
| --------- | --------------------------------------- |
| Frontend  | React + Vite + TypeScript               |
| Estilos   | CSS propio (`src/assets/global.css`)    |
| Backend   | Node.js + Express + TypeScript          |
| Base datos| PostgreSQL (`pg`)                       |
| IA        | API OpenAI-compatible (o modo demo)     |
| Tests     | Vitest                                  |

## Estructura del Proyecto

```
Boty/
├── frontend/                  # React + Vite + TypeScript
│   ├── public/                # Archivos estáticos
│   └── src/
│       ├── assets/            # Estilos globales
│       ├── components/        # Chat, ChatInput, Message (opciones seleccionables)
│       ├── pages/             # ChatPage
│       ├── hooks/             # useChat (estado y envío de mensajes)
│       ├── services/          # api.ts (llamadas al backend)
│       └── types/             # chat.ts (ChatMessage, roles, opciones)
├── backend/                   # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/            # Configuración desde variables de entorno
│   │   ├── controllers/       # chat.ts, auth.ts (validación y respuesta HTTP)
│   │   ├── db/                # pool de PostgreSQL + initDb (tabla users)
│   │   ├── middleware/        # error.ts, logger.ts
│   │   ├── models/            # user.ts (acceso a la tabla users)
│   │   ├── routes/            # chat.ts, auth.ts, health.ts
│   │   ├── services/          # llm.ts (modo demo/live), intent.ts, auth.ts
│   │   └── utils/             # asyncHandler.ts
│   └── tests/                 # Pruebas unitarias (Vitest)
├── docs/                      # Documentación del proyecto
└── ideas.txt                  # Hoja de ruta original
```

## Arquitectura

```
Frontend (React) → API Backend (Express) → LLM + Detección de intenciones
```

* Arquitectura **Cliente-Servidor**
* Manejo de estado de conversación (historial en memoria por sesión)
* API REST
* En modo demo, el backend responde según intenciones detectadas por palabras clave y el saludo ofrece opciones seleccionables

## Requisitos previos

* Node.js 18+
* PostgreSQL (para el registro de usuarios; el chat demo funciona sin BD)
* Git

## Cómo empezar

### Instalación

```bash
git clone https://github.com/JohanHawkins/Boty.git
cd Boty
```

### Backend

```bash
cd backend
cp .env.example .env   # ajusta las variables si lo necesitas
npm install
npm run dev            # http://localhost:3000
```

Variables de entorno (`backend/.env`):

| Variable        | Descripción                                             | Default                              |
| --------------- | ------------------------------------------------------- | ------------------------------------ |
| `PORT`          | Puerto del servidor                                     | `3000`                               |
| `NODE_ENV`      | Entorno                                                 | `development`                        |
| `DATABASE_URL`  | Conexión a PostgreSQL (`postgres://user:pass@host:5432/db`) | `postgres://postgres:postgres@localhost:5432/boty` |
| `LLM_MODE`      | `demo` (simulado) o `live` (LLM real)                   | auto: demo sin key, live con key     |
| `LLM_API_KEY`   | Clave del proveedor LLM (solo en `live`)                | `tu_api_key_aqui`                    |
| `LLM_MODEL`     | Modelo del proveedor                                    | `gpt-4o-mini`                        |
| `LLM_API_URL`   | Endpoint compatible con OpenAI                          | `https://api.openai.com/v1/chat/completions` |

> Ollama local: `LLM_API_URL=http://localhost:11434/v1/chat/completions`

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxy /api → :3000)
```

### Tests y build

```bash
cd backend && npm test
cd frontend && npm run build
```

## Hoja de Ruta

Ver `ideas.txt` para la guía completa de niveles y evolución:

1. **Completado** — React + chat UI, Backend Express + IA (modo demo y live), opciones seleccionables, detección de intenciones, PostgreSQL (tabla `users`) y registro de usuarios
2. **Siguiente** — Autenticación (JWT), historial de conversaciones persistido, RAG, deploy

## Visión a futuro

* Agentes (CrewAI)
* Memoria avanzada (vector DB)
* Automatización (n8n)
