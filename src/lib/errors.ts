export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(error: unknown, fallback = "Что-то пошло не так"): string {
  if (error instanceof AppError) return error.message;
  console.error(error);
  return fallback;
}
