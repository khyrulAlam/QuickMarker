/**
 * Debounce Utilities
 * 
 * Pure utility functions for performance optimization through debouncing.
 * These functions help reduce the frequency of expensive operations like
 * auto-save, API calls, and DOM updates.
 * 
 * Key responsibilities:
 * - Provide configurable debouncing for function calls
 * - Handle cleanup and cancellation of pending operations
 * - Support both leading and trailing edge execution
 * - Provide specialized debounce functions for common use cases
 */

/**
 * Generic debounce function that delays execution until after delay milliseconds
 * have elapsed since the last time it was invoked
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Configuration options
 * @returns Debounced function with cancel method
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;    // Execute on leading edge
    trailing?: boolean;   // Execute on trailing edge
    maxWait?: number;     // Maximum time to wait before execution
  } = {}
): T & { cancel: () => void; flush: () => void } => {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId: number | null = null;
  let maxTimeoutId: number | null = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;
  
  const invokeFunc = (time: number): ReturnType<T> => {
    const args = lastArgs!;
    const thisArg = lastThis;
    
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };
  
  const leadingEdge = (time: number): ReturnType<T> => {
    lastInvokeTime = time;
    timeoutId = window.setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  };
  
  const remainingWait = (time: number): number => {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };
  
  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };
  
  const timerExpired = (): ReturnType<T> | undefined => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait(time));
    return undefined;
  };
  
  const trailingEdge = (time: number): ReturnType<T> => {
    timeoutId = null;
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  };
  
  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
  };
  
  const flush = (): ReturnType<T> => {
    if (timeoutId === null) {
      return result;
    }
    return trailingEdge(Date.now());
  };
  
  const debounced = ((...args: Parameters<T>): ReturnType<T> => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = window.setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    
    if (timeoutId === null) {
      timeoutId = window.setTimeout(timerExpired, delay);
    }
    
    return result;
  }) as T & { cancel: () => void; flush: () => void };
  
  debounced.cancel = cancel;
  debounced.flush = flush;
  
  return debounced;
};

/**
 * Simple debounce function for basic use cases
 * Only executes on trailing edge with no advanced options
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const simpleDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: number | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced;
};

/**
 * Throttle function that limits execution to at most once per delay period
 * Ensures function is called at most once per specified time period
 * 
 * @param func - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @param options - Configuration options
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => void } => {
  return debounce(func, delay, {
    leading: true,
    trailing: true,
    maxWait: delay,
    ...options,
  });
};

/**
 * Creates a debounced auto-save function specifically for marker data
 * Pre-configured with common auto-save settings
 * 
 * @param saveFunction - Function to call for saving
 * @param delay - Auto-save delay in milliseconds (default 2000ms)
 * @returns Debounced auto-save function with status methods
 */
export const createAutoSave = <T extends any[]>(
  saveFunction: (...args: T) => Promise<void> | void,
  delay: number = 2000
): {
  save: (...args: T) => void;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
  getTimeUntilSave: () => number | null;
} => {
  let lastScheduledTime: number | null = null;
  
  const debouncedSave = debounce(
    async (...args: T) => {
      try {
        await saveFunction(...args);
        lastScheduledTime = null;
      } catch (error) {
        console.error('Auto-save failed:', error);
        lastScheduledTime = null;
      }
    },
    delay,
    { trailing: true }
  );
  
  const wrappedSave = (...args: T): void => {
    lastScheduledTime = Date.now();
    debouncedSave(...args);
  };
  
  const cancel = (): void => {
    lastScheduledTime = null;
    debouncedSave.cancel();
  };
  
  const flush = (): void => {
    lastScheduledTime = null;
    debouncedSave.flush();
  };
  
  const isPending = (): boolean => {
    return lastScheduledTime !== null;
  };
  
  const getTimeUntilSave = (): number | null => {
    if (lastScheduledTime === null) return null;
    
    const elapsed = Date.now() - lastScheduledTime;
    const remaining = Math.max(0, delay - elapsed);
    return remaining;
  };
  
  return {
    save: wrappedSave,
    cancel,
    flush,
    isPending,
    getTimeUntilSave,
  };
};

/**
 * Creates a debounced resize handler with common resize-specific optimizations
 * 
 * @param handler - Resize handler function
 * @param delay - Debounce delay (default 100ms for responsive feel)
 * @returns Debounced resize handler
 */
export const createDebouncedResize = (
  handler: () => void,
  delay: number = 100
): (() => void) & { cancel: () => void } => {
  return debounce(handler, delay, {
    leading: false,
    trailing: true,
  });
};

/**
 * Creates a debounced search function with typical search behavior
 * Executes immediately if query is empty (for clearing results)
 * 
 * @param searchFunction - Search function to execute
 * @param delay - Delay for non-empty queries (default 300ms)
 * @returns Debounced search function
 */
export const createDebouncedSearch = (
  searchFunction: (query: string) => void,
  delay: number = 300
): ((query: string) => void) & { cancel: () => void } => {
  const debouncedSearch = debounce(searchFunction, delay);
  
  const wrappedSearch = (query: string): void => {
    if (query.trim() === '') {
      // Execute immediately for empty queries to clear results
      debouncedSearch.cancel();
      searchFunction(query);
    } else {
      debouncedSearch(query);
    }
  };
  
  return Object.assign(wrappedSearch, {
    cancel: debouncedSearch.cancel,
  });
};

/**
 * Creates a debounced validation function for form inputs
 * Validates immediately on blur, with delay on input
 * 
 * @param validationFunction - Validation function to execute
 * @param delay - Delay for input events (default 500ms)
 * @returns Object with input and blur handlers
 */
export const createDebouncedValidation = (
  validationFunction: (value: string) => void,
  delay: number = 500
): {
  onInput: (value: string) => void;
  onBlur: (value: string) => void;
  cancel: () => void;
} => {
  const debouncedValidate = debounce(validationFunction, delay);
  
  return {
    onInput: debouncedValidate,
    onBlur: (value: string) => {
      debouncedValidate.cancel();
      validationFunction(value);
    },
    cancel: debouncedValidate.cancel,
  };
};

/**
 * Utility to batch multiple operations into a single debounced execution
 * Useful when multiple related state changes should be processed together
 * 
 * @param batchFunction - Function that processes accumulated operations
 * @param delay - Delay before processing batch
 * @returns Function to add operations to the batch
 */
export const createBatchProcessor = <T>(
  batchFunction: (operations: T[]) => void,
  delay: number = 100
): {
  add: (operation: T) => void;
  flush: () => void;
  cancel: () => void;
  size: () => number;
} => {
  let operations: T[] = [];
  
  const debouncedProcess = debounce(() => {
    if (operations.length > 0) {
      const batch = [...operations];
      operations = [];
      batchFunction(batch);
    }
  }, delay);
  
  return {
    add: (operation: T) => {
      operations.push(operation);
      debouncedProcess();
    },
    flush: () => {
      debouncedProcess.flush();
    },
    cancel: () => {
      operations = [];
      debouncedProcess.cancel();
    },
    size: () => operations.length,
  };
};