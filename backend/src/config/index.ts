import 'dotenv/config';

interface Config {
  port: number;
  nodeEnv: string;
  llm: {
    apiKey: string;
    model: string;
    url: string;
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    url: process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
  },
};

export default config;
