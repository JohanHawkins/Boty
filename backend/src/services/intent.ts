interface IntentAction {
  keywords: string[];
  run: () => string;
  options?: string[];
}

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
  gestionar_correos: {
    keywords: [
      'gestion de correos',
      'correos y contrasenas',
      'contrasena',
      'contrasenas',
      'contra',
    ],
    run: () => 'Puedo ayudarte a guardar y consultar tus correos y contraseñas. En el modo demo no persisto nada aún, pero con PostgreSQL podré guardarlos de forma segura.',
  },
  recordatorios: {
    keywords: ['recordatorio', 'recordatorios', 'recordar', 'alarma', 'recordame', 'recuerdame'],
    run: () => 'Claro, puedo crear recordatorios por ti. En este modo demo aún no tengo persistencia, pero con la base de datos podrás agendar y consultar recordatorios.',
  },
  guardar_informacion: {
    keywords: ['guardar informacion', 'guardar'],
    run: () => 'Perfecto, puedo guardar información para ti. Aún estoy en modo demo, así que no la persisto, pero pronto podré almacenarla en la base de datos.',
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
