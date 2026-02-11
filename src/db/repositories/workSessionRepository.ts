import { type WorkSessionRecord, STORES } from '../schema';
import { getObjectStore, promisifyRequest, batchedOperations } from '../connection';
import { type Marker, type CanvasDimensions } from '@/lib/types';

/**
 * WorkSession Repository
 * 
 * Handles all CRUD operations for work session data in IndexedDB.
 * A work session represents the current annotation project including
 * the image being annotated and all placed markers.
 * 
 * Key responsibilities:
 * - Save/load current annotation work
 * - Manage auto-save functionality data
 * - Handle image data persistence
 * - Track session metadata and timing
 * - Manage session cleanup on new image uploads
 */

/**
 * Saves the current work session to IndexedDB
 * This includes the image data, all markers, and canvas dimensions
 * 
 * @param imageData - Base64 encoded image data
 * @param imageName - Original filename for user reference
 * @param markers - Array of all placed markers
 * @param canvasDimensions - Current canvas size for proper restoration
 * @returns Promise that resolves when session is saved
 * @throws Error if database write fails
 */
export const saveWorkSession = async (
  imageData: string,
  imageName: string,
  markers: Marker[],
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    const now = Date.now();
    
    // Check if a session already exists to preserve creation time (using batched operation)
    let createdAt = now;
    try {
      const existingSession = await batchedOperations.get(STORES.WORK_SESSION, 'current');
      if (existingSession) {
        createdAt = existingSession.createdAt;
      }
    } catch {
      // If we can't check existing session, just use current time
    }
    
    // Create the work session record
    const sessionRecord: WorkSessionRecord = {
      id: 'current',
      imageData,
      imageName,
      markers: markers.map(marker => ({ ...marker })), // Deep copy to avoid mutations
      canvasDimensions: { ...canvasDimensions },
      createdAt,
      lastUpdated: now,
      version: 1, // For future schema migrations
    };
    
    // Use batched operation for improved performance
    await batchedOperations.put(STORES.WORK_SESSION, sessionRecord);
    
  } catch (error) {
    console.error('Failed to save work session to IndexedDB:', error);
    throw new Error('Work session save failed');
  }
};

/**
 * Loads the current work session from IndexedDB
 * Returns null if no session exists
 * 
 * @returns Promise that resolves to work session data or null
 * @throws Error if database access fails
 */
export const loadWorkSession = async (): Promise<WorkSessionRecord | null> => {
  try {
    // Use batched operation for improved performance
    const result = await batchedOperations.get(STORES.WORK_SESSION, 'current');
    return result || null;
    
  } catch (error) {
    console.error('Failed to load work session from IndexedDB:', error);
    // Return null instead of throwing to allow app to continue with fresh state
    return null;
  }
};

/**
 * Updates only the markers in the current work session
 * This is more efficient than saving the entire session when only markers change
 * 
 * @param markers - Updated array of markers
 * @returns Promise that resolves when markers are updated
 * @throws Error if no session exists or database operation fails
 */
export const updateSessionMarkers = async (markers: Marker[]): Promise<void> => {
  try {
    // Load existing session using batched operation
    const existingSession = await batchedOperations.get(STORES.WORK_SESSION, 'current');
    if (!existingSession) {
      throw new Error('No existing work session to update');
    }
    
    // Update only markers and timestamp
    const updatedSession: WorkSessionRecord = {
      ...existingSession,
      markers: markers.map(marker => ({ ...marker })), // Deep copy
      lastUpdated: Date.now(),
    };
    
    // Use batched operation for improved performance
    await batchedOperations.put(STORES.WORK_SESSION, updatedSession);
    
  } catch (error) {
    console.error('Failed to update session markers:', error);
    throw new Error('Session markers update failed');
  }
};

/**
 * Updates only the canvas dimensions in the current work session
 * Used when the canvas is resized but other data remains the same
 * 
 * @param canvasDimensions - Updated canvas dimensions
 * @returns Promise that resolves when dimensions are updated
 * @throws Error if no session exists or database operation fails
 */
export const updateSessionCanvasDimensions = async (
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    // Load existing session
    const existingSession = await loadWorkSession();
    if (!existingSession) {
      throw new Error('No existing work session to update');
    }
    
    // Update only canvas dimensions and timestamp
    const updatedSession: WorkSessionRecord = {
      ...existingSession,
      canvasDimensions: { ...canvasDimensions },
      lastUpdated: Date.now(),
    };
    
    const store = await getObjectStore(STORES.WORK_SESSION, 'readwrite');
    const request = store.put(updatedSession);
    await promisifyRequest(request);
    
  } catch (error) {
    console.error('Failed to update session canvas dimensions:', error);
    throw new Error('Session canvas dimensions update failed');
  }
};

/**
 * Deletes the current work session
 * This is called when a new image is uploaded or user explicitly clears the session
 * 
 * @returns Promise that resolves when session is deleted
 * @throws Error if database operation fails
 */
export const deleteWorkSession = async (): Promise<void> => {
  try {
    // Use batched operation for improved performance
    await batchedOperations.delete(STORES.WORK_SESSION, 'current');
    
  } catch (error) {
    console.error('Failed to delete work session:', error);
    throw new Error('Work session deletion failed');
  }
};

/**
 * Checks if a work session exists in the database
 * Useful for determining if there's existing work to restore
 * 
 * @returns Promise that resolves to true if session exists, false otherwise
 */
export const workSessionExists = async (): Promise<boolean> => {
  try {
    // Use batched operation for improved performance
    const result = await batchedOperations.get(STORES.WORK_SESSION, 'current');
    return result !== undefined;
    
  } catch (error) {
    console.error('Failed to check work session existence:', error);
    // Assume no session exists if check fails
    return false;
  }
};

/**
 * Gets metadata about the work session without loading the full data
 * Useful for showing session info in UI without loading large image data
 * 
 * @returns Promise that resolves to session metadata or null if not found
 */
export const getWorkSessionMetadata = async (): Promise<{
  imageName: string;
  markerCount: number;
  createdAt: number;
  lastUpdated: number;
  version: number;
} | null> => {
  try {
    // Use batched operation for improved performance
    const result = await batchedOperations.get(STORES.WORK_SESSION, 'current');
    
    if (result) {
      return {
        imageName: result.imageName,
        markerCount: result.markers.length,
        createdAt: result.createdAt,
        lastUpdated: result.lastUpdated,
        version: result.version,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Failed to get work session metadata:', error);
    return null;
  }
};

/**
 * Creates a new work session and clears any existing one
 * This is called when a new image is uploaded
 * 
 * @param imageData - Base64 encoded image data
 * @param imageName - Original filename
 * @param canvasDimensions - Initial canvas dimensions
 * @returns Promise that resolves when new session is created
 * @throws Error if database operation fails
 */
export const createNewWorkSession = async (
  imageData: string,
  imageName: string,
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    // Save new session with empty markers array
    await saveWorkSession(imageData, imageName, [], canvasDimensions);
    
  } catch (error) {
    console.error('Failed to create new work session:', error);
    throw new Error('New work session creation failed');
  }
};

/**
 * Gets the image data from the current work session
 * This is separated from loadWorkSession to avoid loading full session
 * when only image data is needed
 * 
 * @returns Promise that resolves to image data or null if not found
 */
export const getSessionImageData = async (): Promise<string | null> => {
  try {
    const store = await getObjectStore(STORES.WORK_SESSION, 'readonly');
    const request = store.get('current');
    const result = await promisifyRequest(request);
    
    return result ? result.imageData : null;
    
  } catch (error) {
    console.error('Failed to get session image data:', error);
    return null;
  }
};