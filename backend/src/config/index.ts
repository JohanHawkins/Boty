import 'dotenv/config';

interface Config {
  port: number;
  nodeEnv: string;
  db: {
    url: string;
  };
  llm: {
    apiKey: string;
    model: string;
    url: string;
    mode: 'demo' | 'live';
  };
}

const hasApiKey = !!(process.env.LLM_API_KEY && process.env.LLM_API_KEY !== 'tu_api_key_aqui');

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    url:
      process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/boty',
  },
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    url: process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
    mode: process.env.LLM_MODE === 'live' ? 'live' : hasApiKey ? 'live' : 'demo',
  },
};

export default config;
