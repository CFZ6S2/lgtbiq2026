import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error en desarrollo
  if (config.NODE_ENV === 'development') {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
  }

  // Errores de Mongoose (si usáramos MongoDB)
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { ...err, message, statusCode: 404 };
  }

  // Errores de duplicado en base de datos
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2002') {
    const message = 'Ya existe un registro con estos datos';
    error = { ...err, message, statusCode: 400 };
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message);
    error = { ...err, message: (message as any).join(', '), statusCode: 400 };
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = { ...err, message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = { ...err, message, statusCode: 401 };
  }

  // Errores de rate limiting
  if ((err as any).statusCode === 429) {
    const message = 'Demasiadas solicitudes, por favor intenta más tarde';
    error = { ...err, message, statusCode: 429 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Manejador de errores no capturados
export const uncaughtExceptionHandler = (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Cerrando aplicación...');
  console.error(err.name, err.message);
  process.exit(1);
};

export const unhandledRejectionHandler = (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Cerrando aplicación...');
  console.error(err.name, err.message);
  process.exit(1);
};
