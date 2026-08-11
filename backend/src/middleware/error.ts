import { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: Error | HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : 'Error interno del servidor';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(status).json({ error: message });
}
