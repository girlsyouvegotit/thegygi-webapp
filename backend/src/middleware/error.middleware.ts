import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
  value?: string;
  path?: string;
}

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error = { ...err };
  error.message = err.message;

  // Only log 500 errors, not 401s or 404s
  const statusCode = error.statusCode || err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(
      `[${new Date().toISOString()}] ${statusCode} - ${error.message}`,
    );
    console.error(err.stack);
  } else {
    // Log 4xx errors quietly (or not at all)
    console.log(`${req.method} ${req.path} - ${statusCode} - ${error.message}`);
  }

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    const message = `Duplicate field value entered for ${field}. Please use another value`;
    error = new ApiError(message, 400);
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    const message = `Invalid input data: ${errors.join(", ")}`;
    error = new ApiError(message, 400);
  }

  const finalStatusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "Internal Server Error";

  const response: any = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  };

  res.status(finalStatusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const badRequest = (message: string): ApiError => {
  return new ApiError(message, 400);
};

export const unauthorized = (message: string = "Unauthorized"): ApiError => {
  return new ApiError(message, 401);
};

export const forbidden = (message: string = "Forbidden"): ApiError => {
  return new ApiError(message, 403);
};

export const notFound = (message: string = "Not found"): ApiError => {
  return new ApiError(message, 404);
};

export const conflict = (message: string = "Conflict"): ApiError => {
  return new ApiError(message, 409);
};

export const tooManyRequests = (
  message: string = "Too many requests",
): ApiError => {
  return new ApiError(message, 429);
};

export const validationError = (errors: Record<string, string>): ApiError => {
  const message = Object.entries(errors)
    .map(([field, error]) => `${field}: ${error}`)
    .join(", ");
  return new ApiError(message, 422);
};

export const databaseError = (message: string = "Database error"): ApiError => {
  return new ApiError(message, 500);
};

export const serviceError = (
  message: string = "External service error",
): ApiError => {
  return new ApiError(message, 502);
};
