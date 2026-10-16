export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
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
