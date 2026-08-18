interface IntentAction {
  keywords: string[];
  run: () => string;
  options?: string[];
}

const pedirCredenciales = (): string =>
  'Por favor, dime tu nombre de usuario y tu acceso. Si no lo tienes, dímelo y lo creamos.';

const intentBank: Record<string, IntentAction> = {
  saludar: {
    keywords: ['hola', 'buenas', 'buenos dias', 'hey', 'hi', 'hello', 'saludos', 'que tal'],
    run: () => '¡Hola! soy Boty, tu asistente de gestion de datos personales. ¿En que te puedo ayudar?',
    options: ['Gestion de Correos y Contraseñas', 'Recordatorios', 'Guardar informacion'],
  },
  presentarse: {
    keywords: ['quien eres', 'que eres', 'quien sos', 'presenta'],
    run: () => 'Soy Boty, un asistente construido con React, Node.js y Express. Ahora mismo estoy en modo demo: aún no hay un modelo de IA conectado, pero el flujo del chat ya funciona completo.',
  },
  ayuda: {
    keywords: ['ayuda', 'help', 'que puedes', 'que haces', 'funciones', 'funcione'],
    run: () => 'Estoy en modo demo y mis respuestas son simuladas. Puedo saludarte, contarte quién soy y reconocer un par de intenciones básicas. Cuando configures una API de IA (o un modelo local como Ollama), responderé de verdad.',
  },
  agradecer: {
    keywords: ['gracias', 'thank', 'te aprecio'],
    run: () => '¡De nada! Cuando conectes un modelo real podré ayudarte con mucho más.',
  },
  registrar_usuario: {
    keywords: [
      'no lo tengo',
      'no tengo',
      'no tengo cuenta',
      'crear cuenta',
      'crearme una cuenta',
      'registrarme',
      'registrarse',
      'registrar',
      'registro',
      'nuevo usuario',
      'no',
    ],
    run: () => '¡Perfecto! Vamos a crear tu cuenta. Dime tu nombre de usuario para registrarte.',
  },
  proporcionar_credenciales: {
    keywords: [
      'usuario y acceso',
      'usuario y clave',
      'usuario y contrasena',
      'mi usuario',
      'mi clave',
      'mi acceso',
      'mi contrasena',
      'usuario',
      'clave',
      'acceso',
      'contrasena',
    ],
    run: () => 'Déjame verificar tu usuario y tu acceso.',
  },
  guardar_contrasena: {
    keywords: ['guardar contrasena', 'guardar contrasenas'],
    run: () => 'Dime qué quieres guardar.',
  },
  ver_contrasenas: {
    keywords: [
      'contrasenas guardadas',
      'ver contrasenas',
      'ver mis contrasenas',
      'mis contrasenas',
      'listar contrasenas',
      'consultar contrasenas',
    ],
    run: () => 'Te muestro tus contraseñas guardadas.',
  },
  gestionar_correos: {
    keywords: [
      'gestion de correos',
      'correos y contrasenas',
      'contrasena',
      'contrasenas',
      'contra',
    ],
    run: pedirCredenciales,
  },
  recordatorios: {
    keywords: ['recordatorio', 'recordatorios', 'recordar', 'alarma', 'recordame', 'recuerdame'],
    run: pedirCredenciales,
  },
  guardar_informacion: {
    keywords: ['guardar informacion', 'guardar'],
    run: pedirCredenciales,
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);
}

const CREDENTIAL_STOPWORDS = new Set([
  'mi',
  'mis',
  'usuario',
  'usuarios',
  'clave',
  'acceso',
  'contrasena',
  'contrasenas',
  'es',
  'son',
  'y',
  'la',
  'el',
  'los',
  'las',
  'de',
  'del',
  'para',
  'por',
  'que',
  'con',
]);

export function parseCredentials(
  text: string,
  options?: { exactTokens?: boolean }
): { username: string; password: string } | null {
  const tokens = tokenize(text).filter((token) => !CREDENTIAL_STOPWORDS.has(token));
  if (options?.exactTokens ? tokens.length !== 2 : tokens.length < 2) {
    return null;
  }
  return {
    username: tokens[0],
    password: tokens.slice(1).join(''),
  };
}

export function detectIntent(
  text: string
): { action: string; reply: string; options?: string[] } | null {
  const tokens = tokenize(text);

  for (const [name, intent] of Object.entries(intentBank)) {
    const matched = intent.keywords.some((keyword) => {
      const keywordTokens = keyword.split(' ');
      return keywordTokens.every((token) => tokens.includes(token));
    });

    if (matched) {
      return { action: name, reply: intent.run(), options: intent.options };
    }
  }

  return null;
}
