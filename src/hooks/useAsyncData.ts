import { DependencyList, useEffect, useState } from 'react';

export function useAsyncData<T>(
  task: () => Promise<T>,
  deps: DependencyList,
  initialValue: T,
) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await task();

        if (!cancelled) {
          setData(result);
        }
      } catch (taskError) {
        if (!cancelled) {
          setError(taskError instanceof Error ? taskError.message : 'Ocurrió un error inesperado.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, setData, isLoading, error };
}
