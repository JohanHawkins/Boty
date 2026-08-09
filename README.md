# Boty

Hoja de ruta clara, escalable y alineada con buenas prácticas de arquitectura moderna para construir **"Boty"** desde cero hasta nivel industrial.

Boty es un chatbot construido desde el **Nivel Medio (aplicación funcional con persistencia)** pero con mentalidad de MVP, pensado para evolucionar hacia agentes, memoria avanzada y automatización.

## Stack Tecnológico

| Capa      | Tecnología                              |
| --------- | --------------------------------------- |
| Frontend  | React + Vite + TypeScript               |
| Estilos   | Bootstrap o Tailwind                    |
| Backend   | Node.js + Express                       |
| Base datos| PostgreSQL                              |
| IA        | Veremos (en evaluación)                 |

## Estructura del Proyecto

```
Boty/
├── frontend/                  # React + Vite + TypeScript
│   ├── public/                # Archivos estáticos
│   └── src/
│       ├── assets/            # Recursos (imágenes, estilos globales)
│       ├── components/        # Componentes reutilizables (Chat, Mensaje, Input)
│       ├── pages/             # Vistas (Chat, Login, Home)
│       ├── hooks/             # Hooks personalizados (useChat, useAuth)
│       ├── services/          # Llamadas a la API backend
│       └── types/             # Tipos e interfaces de TypeScript
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuración (env, base de datos)
│   │   ├── controllers/       # Lógica de las rutas
│   │   ├── middleware/        # Auth (JWT), errores, logs
│   │   ├── models/            # Modelos (Usuarios, Conversaciones, Mensajes)
│   │   ├── routes/            # Definición de endpoints
│   │   ├── services/          # Lógica de negocio y llamadas a la IA
│   │   └── utils/             # Utilidades
│   └── tests/                 # Pruebas unitarias
├── docs/                      # Documentación del proyecto
└── ideas.txt                  # Hoja de ruta original
```

## Arquitectura

```
Frontend → API Backend → LLM + DB
```

* Arquitectura **Cliente-Servidor**
* Manejo de estado de conversación
* API REST o WebSockets
* Introducción de **memoria contextual**

## Requisitos previos

* Node.js 18+
* PostgreSQL
* Git + GitHub

## Cómo empezar (próximamente)

> Las carpetas ya están creadas. Los archivos de configuración y código se agregarán en los próximos pasos.

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/JohanHawkins/Boty.git
cd Boty
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Hoja de Ruta

Ver `ideas.txt` para la guía completa de niveles y evolución:

1. **Semana 1** — React + chat UI, Backend Express + IA
2. **Semana 2** — PostgreSQL + historial, Autenticación
3. **Semana 3** — RAG básico (docs/PDFs)
4. **Semana 4** — Deploy completo (Render + Vercel)

## Visión a futuro

* Agentes (CrewAI)
* Memoria avanzada (vector DB)
* Automatización (n8n)
