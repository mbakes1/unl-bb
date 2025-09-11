import { useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(
  value: T, 
  delay: number,
  options: { leading?: boolean, maxWait?: number } = {}
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [firstChange, setFirstChange] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }

    // For immediate feedback on first change (like when clearing search)
    if (options.leading && firstChange && value !== debouncedValue) {
      setDebouncedValue(value);
      setFirstChange(false);
      lastUpdateRef.current = Date.now();
      return;
    }

    // Set regular debounce timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastUpdateRef.current = Date.now();
      setFirstChange(false);
    }, delay);

    // Set maxWait timeout to ensure value updates even if component keeps re-rendering
    if (options.maxWait) {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      const maxWaitDelay = Math.max(0, options.maxWait - timeSinceLastUpdate);
      
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setDebouncedValue(value);
        lastUpdateRef.current = Date.now();
        setFirstChange(false);
      }, maxWaitDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, [value, delay, options.leading, options.maxWait, firstChange, debouncedValue]);

  return debouncedValue;
}
