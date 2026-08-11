import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.use('/api', chatRoutes);
app.use('/', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
