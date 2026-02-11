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