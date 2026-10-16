export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}



export function AppError(statusCode: number, message: string, isOperational = true): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  Error.captureStackTrace(error, AppError);
  return error;
}






// export class AppError extends Error {
//   public readonly statusCode: number;
//   public readonly isOperational: boolean;

//   constructor(statusCode: number, message: string, isOperational = true) {
//     super(message);
//     this.statusCode = statusCode;
//     this.isOperational = isOperational;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
