export function success<T>(data: T, meta?: { page: number; limit: number; total: number }) {
  return { success: true as const, data, ...(meta && { meta }) };
}

export function error(code: string, message: string, statusCode = 400) {
  return {
    success: false as const,
    error: { code, message },
    statusCode,
  };
}
