/**
 * Database Error Handler
 * Fallback para mock data quando banco não está disponível
 */

import { mockData } from '../mockData';

export async function withFallback<T>(
  queryFn: () => Promise<T>,
  mockFn: () => T,
): Promise<T> {
  try {
    return await queryFn();
  } catch (error: any) {
    // Se erro de conexão ao banco, usa mock data
    const isConnectionError =
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'P1001' ||
      error?.message?.includes("Can't reach database server") ||
      error?.message?.includes('connection refused') ||
      error?.constructor?.name === 'PrismaClientInitializationError';

    if (isConnectionError) {
      console.warn('⚠️ Database not available, using mock data:', error?.message);
      return mockFn();
    }
    throw error;
  }
}

export { mockData };
