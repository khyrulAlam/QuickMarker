import { DB_NAME, DB_VERSION, STORES, STORE_CONFIGS } from './schema';

/**
 * IndexedDB Connection Management
 * 
 * This module handles the low-level database connection, initialization,
 * and store creation for QuickMark's persistence layer.
 * 
 * Key responsibilities:
 * - Database opening and version management
 * - Object store creation and index setup
 * - Error handling and connection recovery
 * - Transaction management utilities
 */

/**
 * Database connection instance (singleton pattern)
 * Ensures we only open one connection per session
 */
let dbInstance: IDBDatabase | null = null;

/**
 * Opens a connection to the IndexedDB database
 * Creates object stores and indexes if they don't exist
 * 
 * @returns Promise that resolves to the database instance
 * @throws Error if database creation fails
 */
export const openDatabase = async (): Promise<IDBDatabase> => {
  // Return existing connection if available
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    /**
     * Handle database upgrade/creation
     * This runs when the database is first created or version is upgraded
     */
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      try {
        // Create UserSettings store if it doesn't exist
        if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
          const userSettingsStore = db.createObjectStore(
            STORES.USER_SETTINGS, 
            STORE_CONFIGS[STORES.USER_SETTINGS]
          );
          
          // Create indexes for UserSettings
          STORE_CONFIGS[STORES.USER_SETTINGS].indexes.forEach(index => {
            userSettingsStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create WorkSession store if it doesn't exist
        if (!db.objectStoreNames.contains(STORES.WORK_SESSION)) {
          const workSessionStore = db.createObjectStore(
            STORES.WORK_SESSION,
            STORE_CONFIGS[STORES.WORK_SESSION]
          );
          
          // Create indexes for WorkSession
          STORE_CONFIGS[STORES.WORK_SESSION].indexes.forEach(index => {
            workSessionStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }
      } catch (error) {
        console.error('Failed to create database stores:', error);
        reject(new Error('Database schema creation failed'));
      }
    };

    /**
     * Handle successful database opening
     */
    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      // Handle unexpected database close
      dbInstance.onclose = () => {
        console.warn('Database connection closed unexpectedly');
        dbInstance = null;
      };
      
      // Handle database errors
      dbInstance.onerror = (event) => {
        console.error('Database error:', event);
      };
      
      resolve(dbInstance);
    };

    /**
     * Handle database opening errors
     */
    request.onerror = (event) => {
      console.error('Failed to open database:', event);
      reject(new Error('Database connection failed'));
    };

    /**
     * Handle database being blocked (usually by another tab)
     */
    request.onblocked = () => {
      console.warn('Database connection blocked by another tab');
      reject(new Error('Database blocked by another connection'));
    };
  });
};

/**
 * Closes the database connection
 * Should be called when the application shuts down
 */
export const closeDatabase = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

/**
 * Gets the current database instance without opening a new connection
 * 
 * @returns The current database instance or null if not connected
 */
export const getDatabaseInstance = (): IDBDatabase | null => {
  return dbInstance;
};

/**
 * Creates a transaction for the specified stores
 * Utility function to simplify transaction creation
 * 
 * @param storeNames - Array of store names to include in transaction
 * @param mode - Transaction mode ('readonly' | 'readwrite')
 * @returns Promise that resolves to the transaction
 */
export const createTransaction = async (
  storeNames: string[],
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBTransaction> => {
  const db = await openDatabase();
  return db.transaction(storeNames, mode);
};

/**
 * Creates a single object store reference
 * Utility function for simple store access
 * 
 * @param storeName - Name of the store to access
 * @param mode - Transaction mode ('readonly' | 'readwrite')
 * @returns Promise that resolves to the object store
 */
export const getObjectStore = async (
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> => {
  const transaction = await createTransaction([storeName], mode);
  return transaction.objectStore(storeName);
};

/**
 * Wraps IndexedDB requests in promises for easier async/await usage
 * 
 * @param request - The IDBRequest to wrap
 * @returns Promise that resolves with the request result
 */
export const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Checks if IndexedDB is supported in the current browser
 * 
 * @returns True if IndexedDB is available, false otherwise
 */
export const isIndexedDBSupported = (): boolean => {
  return 'indexedDB' in window;
};

/**
 * Transaction Batching System
 * Optimizes database performance by batching multiple operations into single transactions
 */

interface BatchedOperation {
  storeName: string;
  operation: 'put' | 'get' | 'delete' | 'clear';
  data?: any;
  key?: any;
}

interface BatchResult {
  success: boolean;
  result?: any;
  error?: Error;
}

class TransactionBatcher {
  private pendingOperations: BatchedOperation[] = [];
  private batchTimeout: number | null = null;
  private readonly batchDelay = 50; // 50ms delay to collect operations
  private readonly maxBatchSize = 20; // Maximum operations per batch
  
  /**
   * Adds an operation to the batch queue
   */
  addOperation(operation: BatchedOperation): Promise<BatchResult> {
    return new Promise((resolve) => {
      this.pendingOperations.push({
        ...operation,
        resolve,
      } as any);
      
      // Process batch if we reach max size
      if (this.pendingOperations.length >= this.maxBatchSize) {
        this.processBatch();
      } else {
        // Schedule batch processing if not already scheduled
        this.scheduleBatchProcessing();
      }
    });
  }
  
  /**
   * Schedules batch processing with debouncing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = window.setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }
  
  /**
   * Processes all pending operations in optimized batches
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.pendingOperations.length === 0) {
      return;
    }
    
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    
    // Group operations by store for optimization
    const storeGroups = new Map<string, (BatchedOperation & { resolve: (result: BatchResult) => void })[]>();
    
    operations.forEach((op: any) => {
      if (!storeGroups.has(op.storeName)) {
        storeGroups.set(op.storeName, []);
      }
      storeGroups.get(op.storeName)!.push(op);
    });
    
    // Process each store group
    for (const [storeName, storeOps] of storeGroups) {
      try {
        await this.processStoreOperations(storeName, storeOps);
      } catch (error) {
        // Mark all operations in this store as failed
        storeOps.forEach(op => {
          op.resolve({
            success: false,
            error: error instanceof Error ? error : new Error('Batch operation failed'),
          });
        });
      }
    }
  }
  
  /**
   * Processes operations for a single store in a transaction
   */
  private async processStoreOperations(
    storeName: string,
    operations: (BatchedOperation & { resolve: (result: BatchResult) => void })[]
  ): Promise<void> {
    try {
      const store = await getObjectStore(storeName, 'readwrite');
      const results = new Map<number, any>();
      
      // Execute all operations within the same transaction
      const promises = operations.map(async (op, index) => {
        try {
          let request: IDBRequest;
          
          switch (op.operation) {
            case 'put':
              request = op.key ? store.put(op.data, op.key) : store.put(op.data);
              break;
            case 'get':
              request = store.get(op.key);
              break;
            case 'delete':
              request = store.delete(op.key);
              break;
            case 'clear':
              request = store.clear();
              break;
            default:
              throw new Error(`Unknown operation: ${op.operation}`);
          }
          
          const result = await promisifyRequest(request);
          results.set(index, result);
          
        } catch (error) {
          results.set(index, { error });
        }
      });
      
      // Wait for all operations to complete
      await Promise.all(promises);
      
      // Resolve all operations with their results
      operations.forEach((op, index) => {
        const result = results.get(index);
        if (result?.error) {
          op.resolve({
            success: false,
            error: result.error,
          });
        } else {
          op.resolve({
            success: true,
            result,
          });
        }
      });
      
    } catch (error) {
      // Handle transaction-level errors
      operations.forEach(op => {
        op.resolve({
          success: false,
          error: error instanceof Error ? error : new Error('Transaction failed'),
        });
      });
    }
  }
  
  /**
   * Forces immediate processing of pending operations
   */
  flush(): Promise<void> {
    return this.processBatch();
  }
  
  /**
   * Clears all pending operations (cleanup)
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // Reject all pending operations
    this.pendingOperations.forEach((op: any) => {
      op.resolve({
        success: false,
        error: new Error('Batch operation cancelled'),
      });
    });
    
    this.pendingOperations = [];
  }
}

// Global batcher instance
const transactionBatcher = new TransactionBatcher();

/**
 * Optimized database operations using transaction batching
 * Use these instead of direct store operations for better performance
 */
export const batchedOperations = {
  /**
   * Batched put operation
   */
  put: async (storeName: string, data: any, key?: any): Promise<any> => {
    const result = await transactionBatcher.addOperation({
      storeName,
      operation: 'put',
      data,
      key,
    });
    
    if (!result.success) {
      throw result.error || new Error('Batched put operation failed');
    }
    
    return result.result;
  },
  
  /**
   * Batched get operation
   */
  get: async (storeName: string, key: any): Promise<any> => {
    const result = await transactionBatcher.addOperation({
      storeName,
      operation: 'get',
      key,
    });
    
    if (!result.success) {
      throw result.error || new Error('Batched get operation failed');
    }
    
    return result.result;
  },
  
  /**
   * Batched delete operation
   */
  delete: async (storeName: string, key: any): Promise<void> => {
    const result = await transactionBatcher.addOperation({
      storeName,
      operation: 'delete',
      key,
    });
    
    if (!result.success) {
      throw result.error || new Error('Batched delete operation failed');
    }
  },
  
  /**
   * Batched clear operation
   */
  clear: async (storeName: string): Promise<void> => {
    const result = await transactionBatcher.addOperation({
      storeName,
      operation: 'clear',
    });
    
    if (!result.success) {
      throw result.error || new Error('Batched clear operation failed');
    }
  },
  
  /**
   * Forces immediate execution of all pending operations
   */
  flush: (): Promise<void> => {
    return transactionBatcher.flush();
  },
  
  /**
   * Cancels all pending operations
   */
  cancel: (): void => {
    transactionBatcher.clear();
  },
};

/**
 * Deletes the entire database (useful for testing or data reset)
 * WARNING: This will permanently delete all stored data
 * 
 * @returns Promise that resolves when database is deleted
 */
export const deleteDatabase = async (): Promise<void> => {
  closeDatabase();
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
};