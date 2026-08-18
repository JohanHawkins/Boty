import config from '../config/index.js';
import { detectIntent, parseCredentials } from './intent.js';
import {
  registerUser,
  verifyPassword,
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
} from './auth.js';
import { findUserByUsername, type User } from '../models/user.js';
import { createCredential, findCredentialsByUserId } from '../models/credential.js';
import { HttpError } from '../middleware/error.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmResponse {
  content: string;
  model: string;
  options?: string[];
}

const SYSTEM_PROMPT =
  'Eres Boty, un asistente útil, amable y conciso. Respondes siempre en el idioma del usuario.';

const MAIN_OPTIONS = ['Gestion de Correos y Contraseñas', 'Recordatorios', 'Guardar informacion'];
const CREDENTIAL_OPTIONS = ['Guardar Contraseñas', 'Contraseñas Guardadas'];
const CREDENTIALS_PROMPT =
  'Por favor, dime tu nombre de usuario y tu acceso. Si no lo tienes, dímelo y lo creamos.';

const delay = () => new Promise((resolve) => setTimeout(resolve, 400));

type RegistrationStage =
  | 'awaiting_username'
  | 'awaiting_password'
  | 'awaiting_confirm_create'
  | 'awaiting_credential_title'
  | 'awaiting_credential_value'
  | null;

function getLastAssistantContent(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  return last?.content ?? '';
}

function getRegistrationStage(messages: ChatMessage[]): RegistrationStage {
  const content = getLastAssistantContent(messages);

  if (content.includes('Dime tu nombre de usuario para registrarte')) {
    return 'awaiting_username';
  }
  if (content.includes('Ahora dime tu acceso')) {
    return 'awaiting_password';
  }
  if (content.includes('¿Quieres que lo cree?')) {
    return 'awaiting_confirm_create';
  }
  if (content.includes('dime qué quieres guardar')) {
    return 'awaiting_credential_title';
  }
  if (content.includes('se guardará. Ahora dime el valor')) {
    return 'awaiting_credential_value';
  }

  return null;
}

function extractPendingUsername(messages: ChatMessage[]): string | null {
  const match = getLastAssistantContent(messages).match(/usuario "([^"]+)"/);
  return match ? match[1] : null;
}

function extractPendingCredentialTitle(messages: ChatMessage[]): string | null {
  const match = getLastAssistantContent(messages).match(/dato "([^"]+)" se guardará/);
  return match ? match[1] : null;
}

function getIdentifiedUser(messages: ChatMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== 'assistant') continue;
    const login = m.content.match(/¡Hola (\w+)! Tu acceso es correcto/);
    if (login) return login[1];
    const welcome = m.content.match(/Bienvenido, (\w+)\./);
    if (welcome) return welcome[1];
  }
  return null;
}

function findPendingIntent(messages: ChatMessage[]): string | null {
  const reversed = [...messages].reverse();
  let foundCredentialPrompt = false;

  for (const msg of reversed) {
    if (
      msg.role === 'assistant' &&
      (msg.content.includes('nombre de usuario y tu acceso') ||
        msg.content.includes('usuario y tu acceso'))
    ) {
      foundCredentialPrompt = true;
      continue;
    }
    if (foundCredentialPrompt && msg.role === 'user') {
      const text = msg.content.toLowerCase();
      return detectIntent(text)?.action ?? null;
    }
  }
  return null;
}

function normalizedTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function isAffirmative(text: string): boolean {
  const tokens = normalizedTokens(text);
  return (
    tokens.includes('si') ||
    tokens.some((t) => ['claro', 'dale', 'ok', 'confirmar', 'crear', 'crearlo', 'adelante'].includes(t))
  );
}

function isNegative(text: string): boolean {
  const tokens = normalizedTokens(text);
  return tokens.includes('no') || tokens.includes('cancelar');
}

async function registerNewUser(username: string, password: string): Promise<LlmResponse> {
  try {
    const user = await registerUser(username, password);
    return {
      content: `¡Listo! Tu cuenta fue creada correctamente. Bienvenido, ${user.username}. Ya puedes usar tus credenciales para gestionar tus datos.`,
      model: 'demo-mode',
      options: MAIN_OPTIONS,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return { content: err.message, model: 'demo-mode' };
    }
    return {
      content: 'No pude crear tu cuenta ahora mismo. Inténtalo de nuevo más tarde.',
      model: 'demo-mode',
    };
  }
}

async function handleUsernameRegistration(text: string): Promise<LlmResponse> {
  const credentials = parseCredentials(text, { exactTokens: true });
  if (credentials) {
    return registerNewUser(credentials.username, credentials.password);
  }

  const username = text.trim();
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return {
      content: `El nombre de usuario debe tener entre ${USERNAME_MIN} y ${USERNAME_MAX} caracteres. Inténtalo de nuevo.`,
      model: 'demo-mode',
    };
  }

  try {
    const existing = await findUserByUsername(username);
    if (existing) {
      return {
        content: `El usuario "${username}" ya está en uso. Elige otro nombre.`,
        model: 'demo-mode',
      };
    }
  } catch {
    return {
      content: 'No pude verificar el nombre de usuario ahora mismo. Inténtalo de nuevo más tarde.',
      model: 'demo-mode',
    };
  }

  return {
    content: `¡Genial! El usuario "${username}" está disponible. Ahora dime tu acceso (mínimo ${PASSWORD_MIN} caracteres) para crear tu cuenta.`,
    model: 'demo-mode',
  };
}

async function handlePasswordRegistration(
  text: string,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  const username = extractPendingUsername(messages);
  if (!username) {
    return {
      content: 'Perdí el hilo del registro. Dime tu nombre de usuario para registrarte.',
      model: 'demo-mode',
    };
  }

  const password = text.trim();
  if (password.length < PASSWORD_MIN) {
    return {
      content: `El acceso debe tener al menos ${PASSWORD_MIN} caracteres. Inténtalo de nuevo.`,
      model: 'demo-mode',
    };
  }

  return registerNewUser(username, password);
}

async function handleConfirmCreate(text: string): Promise<LlmResponse> {
  const credentials = parseCredentials(text, { exactTokens: true });
  if (credentials) {
    let existing: User | null = null;
    try {
      existing = await findUserByUsername(credentials.username);
    } catch {
      return {
        content: 'No pude verificar los datos ahora mismo. Inténtalo de nuevo más tarde.',
        model: 'demo-mode',
      };
    }
    if (!existing) {
      return registerNewUser(credentials.username, credentials.password);
    }
    return handleCredentials(credentials);
  }

  if (isAffirmative(text)) {
    return {
      content: '¡Perfecto! Vamos a crear tu cuenta. Dime tu nombre de usuario para registrarte.',
      model: 'demo-mode',
    };
  }

  if (isNegative(text)) {
    return {
      content: 'Entendido, no crearé la cuenta. ¿Te ayudo con algo más?',
      model: 'demo-mode',
    };
  }

  return {
    content: '¿Quieres que cree el usuario? Responde "si" para continuar o "no" para cancelar.',
    model: 'demo-mode',
  };
}

async function handleCredentialAction(): Promise<LlmResponse> {
  return {
    content: 'Perfecto, aquí puedes guardar o consultar tus contraseñas. ¿Qué deseas hacer?',
    model: 'demo-mode',
    options: CREDENTIAL_OPTIONS,
  };
}

async function handleGuardarContrasena(): Promise<LlmResponse> {
  return {
    content:
      'Claro, dime qué quieres guardar. Por ejemplo: el nombre del sitio o "correo de trabajo".',
    model: 'demo-mode',
  };
}

async function handleCredentialTitle(text: string): Promise<LlmResponse> {
  const title = text.trim();
  if (title.length === 0) {
    return {
      content: 'No escuché ningún dato. Dime qué quieres guardar.',
      model: 'demo-mode',
    };
  }
  if (title.length > 100) {
    return {
      content: 'Ese nombre es muy largo (máximo 100 caracteres). Inténtalo de nuevo.',
      model: 'demo-mode',
    };
  }
  return {
    content: `¡Perfecto! El dato "${title}" se guardará. Ahora dime el valor (la contraseña o dato a guardar).`,
    model: 'demo-mode',
  };
}

async function handleCredentialValue(
  text: string,
  username: string,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  const title = extractPendingCredentialTitle(messages);
  const value = text.trim();

  if (!title) {
    return {
      content: 'Perdí el hilo. Dime "Guardar Contraseñas" para empezar de nuevo.',
      model: 'demo-mode',
    };
  }
  if (value.length === 0) {
    return {
      content: `No escuché el valor para "${title}". Dímelo de nuevo.`,
      model: 'demo-mode',
    };
  }
  if (value.length > 500) {
    return {
      content: 'Ese valor es muy largo (máximo 500 caracteres). Inténtalo de nuevo.',
      model: 'demo-mode',
    };
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return {
        content: 'No encontré tu usuario. Inicia sesión de nuevo para continuar.',
        model: 'demo-mode',
      };
    }
    await createCredential(user.id, title, value);
    return {
      content: `¡Listo! Guardé el dato "${title}". ¿Quieres hacer algo más?`,
      model: 'demo-mode',
      options: CREDENTIAL_OPTIONS,
    };
  } catch {
    return {
      content: 'No pude guardar el dato ahora mismo. Inténtalo de nuevo más tarde.',
      model: 'demo-mode',
    };
  }
}

async function handleVerContrasenas(username: string): Promise<LlmResponse> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return {
        content: 'No encontré tu usuario. Inicia sesión de nuevo para continuar.',
        model: 'demo-mode',
      };
    }

    const stored = await findCredentialsByUserId(user.id);
    if (stored.length === 0) {
      return {
        content:
          'Aún no tienes contraseñas guardadas. Dime "Guardar Contraseñas" para guardar la primera.',
        model: 'demo-mode',
        options: ['Guardar Contraseñas'],
      };
    }

    const list = stored.map((c, i) => `${i + 1}. ${c.title}: ${c.value}`).join('\n');
    return {
      content: `Estas son tus contraseñas guardadas:\n\n${list}`,
      model: 'demo-mode',
      options: CREDENTIAL_OPTIONS,
    };
  } catch {
    return {
      content:
        'No pude consultar tus contraseñas ahora mismo. Inténtalo de nuevo más tarde.',
      model: 'demo-mode',
    };
  }
}

async function handleCredentials(
  credentials: { username: string; password: string } | null,
  messages?: ChatMessage[]
): Promise<LlmResponse> {
  if (!credentials) {
    return {
      content: 'No entendí tu usuario y tu acceso. Escríbelos así, por ejemplo: "ana 1234".',
      model: 'demo-mode',
    };
  }

  let user;
  try {
    user = await findUserByUsername(credentials.username);
  } catch {
    return {
      content: 'No pude verificar tus datos ahora mismo. Inténtalo de nuevo más tarde.',
      model: 'demo-mode',
    };
  }

  if (!user) {
    return {
      content: `No tengo registrado el usuario "${credentials.username}". ¿Quieres que lo cree? Dime tu nombre de usuario y tu acceso y lo registro.`,
      model: 'demo-mode',
    };
  }

  if (!verifyPassword(credentials.password, user.passwordHash)) {
    return {
      content: `El acceso no coincide con el usuario "${credentials.username}". Inténtalo de nuevo.`,
      model: 'demo-mode',
    };
  }

  const pendingIntent = messages ? findPendingIntent(messages) : null;

  if (pendingIntent === 'gestionar_correos') {
    return {
      content: `¡Hola ${user.username}! Tu acceso es correcto. Perfecto, aquí puedes guardar o consultar tus contraseñas.`,
      model: 'demo-mode',
      options: CREDENTIAL_OPTIONS,
    };
  }

  return {
    content: `¡Hola ${user.username}! Tu acceso es correcto. ¿En qué te puedo ayudar?`,
    model: 'demo-mode',
    options: MAIN_OPTIONS,
  };
}

async function demoReply(messages: ChatMessage[]): Promise<LlmResponse> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content ?? '').toLowerCase();
  const reply = lastUser?.content ?? '';

  const intent = detectIntent(text);
  const stage = getRegistrationStage(messages);
  const identifiedUser = getIdentifiedUser(messages);

  if (stage === 'awaiting_username') {
    await delay();
    return handleUsernameRegistration(text);
  }

  if (stage === 'awaiting_password') {
    await delay();
    return handlePasswordRegistration(text, messages);
  }

  if (stage === 'awaiting_confirm_create') {
    await delay();
    return handleConfirmCreate(text);
  }

  if (stage === 'awaiting_credential_title') {
    await delay();
    return handleCredentialTitle(text);
  }

  if (stage === 'awaiting_credential_value') {
    await delay();
    if (!identifiedUser) {
      return { content: 'Debes iniciar sesión para guardar datos. Dime tu usuario y tu acceso.', model: 'demo-mode' };
    }
    return handleCredentialValue(text, identifiedUser, messages);
  }

  if (identifiedUser && intent?.action === 'gestionar_correos') {
    await delay();
    return handleCredentialAction();
  }

  if (intent?.action === 'guardar_contrasena' || intent?.action === 'ver_contrasenas') {
    await delay();
    if (!identifiedUser) {
      return { content: CREDENTIALS_PROMPT, model: 'demo-mode' };
    }
    return intent.action === 'guardar_contrasena'
      ? handleGuardarContrasena()
      : handleVerContrasenas(identifiedUser);
  }

  if (intent?.action === 'proporcionar_credenciales') {
    await delay();
    return handleCredentials(parseCredentials(text), messages);
  }

  if (intent) {
    await delay();
    return { content: intent.reply, model: 'demo-mode', options: intent.options };
  }

  const credentials = parseCredentials(text, { exactTokens: true });
  if (credentials) {
    await delay();
    return handleCredentials(credentials, messages);
  }

  const content = `Entiendo que me escribiste: "${reply}". Todavía estoy en modo demo, así que no puedo responder con inteligencia real. Prueba a saludarme o preguntarme quién soy.`;
  await delay();
  return { content, model: 'demo-mode' };
}

export async function generateChatReply(messages: ChatMessage[]): Promise<LlmResponse> {
  if (config.llm.mode === 'demo') {
    return demoReply(messages);
  }

  if (!config.llm.apiKey || config.llm.apiKey === 'tu_api_key_aqui') {
    throw new Error('LLM_API_KEY no configurada. Revisa tu archivo .env');
  }

  const history: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(({ role, content }) => ({ role, content })),
  ];

  const response = await fetch(config.llm.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: history,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error del LLM (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('El LLM no devolvió contenido en la respuesta');
  }

  return { content, model: data.model };
}
