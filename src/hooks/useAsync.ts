import { useState, useCallback } from 'react';

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * A hook for handling async operations with loading states.
 * 
 * @template T The type of data returned by the async function
 * @template E The type of error (defaults to Error)
 * @template P The type of parameters the async function takes
 */
export function useAsync<T, E = Error, P extends any[] = any[]>() {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  // The execute function wraps an async function
  const execute = useCallback(async (asyncFunction: (...params: P) => Promise<T>, ...params: P) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const result = await asyncFunction(...params);
      setData(result);
      setStatus('success');
      return result;
    } catch (error) {
      setError(error as E);
      setStatus('error');
      throw error;
    }
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return {
    execute,
    reset,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
