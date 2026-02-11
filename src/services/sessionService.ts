import { type Marker, type CanvasDimensions } from '@/lib/types';
import * as workSessionRepo from '@/db/repositories/workSessionRepository';
import { imageToBase64, base64ToImage } from '@/utils/imageDataUtils';

/**
 * Session Service
 * 
 * High-level business logic for managing work sessions and auto-save functionality.
 * This service coordinates between the UI, repository, and provides intelligent
 * session management including auto-save, restoration, and cleanup.
 * 
 * Key responsibilities:
 * - Manage work session lifecycle (create, save, restore, cleanup)
 * - Coordinate auto-save functionality with debounced updates
 * - Handle image data conversion and validation
 * - Provide session restoration on app initialization
 * - Manage session cleanup when new images are uploaded
 */

/**
 * Auto-save configuration
 */
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds as specified in requirements
let autoSaveTimeoutId: number | null = null;

/**
 * Initializes the session system and restores previous work if available
 * This should be called when the application starts
 * 
 * @returns Promise that resolves to restored session data or null if no session exists
 */
export const initializeSession = async (): Promise<{
  image: HTMLImageElement;
  imageName: string;
  markers: Marker[];
  canvasDimensions: CanvasDimensions;
} | null> => {
  try {
    const session = await workSessionRepo.loadWorkSession();
    if (!session) {
      return null;
    }
    
    // Convert base64 back to image
    const image = await base64ToImage(session.imageData);
    
    return {
      image,
      imageName: session.imageName,
      markers: session.markers,
      canvasDimensions: session.canvasDimensions,
    };
    
  } catch (error) {
    console.error('Session initialization failed:', error);
    // If session restoration fails, continue with clean state
    return null;
  }
};

/**
 * Creates a new work session when a new image is uploaded
 * This clears any existing session and starts fresh
 * 
 * @param image - The uploaded image element
 * @param imageName - Original filename
 * @param canvasDimensions - Initial canvas dimensions
 * @returns Promise that resolves when new session is created
 */
export const createNewSession = async (
  image: HTMLImageElement,
  imageName: string,
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    // Convert image to base64 for storage
    const imageData = imageToBase64(image);
    
    // Create new session in database
    await workSessionRepo.createNewWorkSession(imageData, imageName, canvasDimensions);
    
    // Clear any pending auto-save
    clearAutoSave();
    
  } catch (error) {
    console.error('Failed to create new session:', error);
    throw new Error('Failed to create new work session');
  }
};

/**
 * Schedules an auto-save operation with debouncing
 * This is called whenever markers are modified to ensure work is preserved
 * 
 * @param markers - Current markers array
 * @returns Promise that resolves when auto-save is scheduled
 */
export const scheduleAutoSave = async (markers: Marker[]): Promise<void> => {
  // Clear any existing auto-save timeout
  clearAutoSave();
  
  // Schedule new auto-save
  autoSaveTimeoutId = window.setTimeout(async () => {
    try {
      await saveSessionMarkers(markers);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw error to avoid disrupting user workflow
    }
  }, AUTO_SAVE_INTERVAL);
};

/**
 * Immediately saves markers to the current session
 * Use this for explicit save operations or when auto-save timing is not suitable
 * 
 * @param markers - Markers to save
 * @returns Promise that resolves when save is complete
 */
export const saveSessionMarkers = async (markers: Marker[]): Promise<void> => {
  try {
    await workSessionRepo.updateSessionMarkers(markers);
  } catch (error) {
    console.error('Failed to save session markers:', error);
    throw new Error('Failed to save markers');
  }
};

/**
 * Updates canvas dimensions in the current session
 * Called when the canvas is resized
 * 
 * @param canvasDimensions - Updated canvas dimensions
 * @returns Promise that resolves when dimensions are saved
 */
export const updateSessionDimensions = async (
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    await workSessionRepo.updateSessionCanvasDimensions(canvasDimensions);
  } catch (error) {
    console.error('Failed to update session dimensions:', error);
    throw new Error('Failed to update canvas dimensions');
  }
};

/**
 * Clears the current work session
 * This permanently deletes the session data
 * 
 * @returns Promise that resolves when session is cleared
 */
export const clearSession = async (): Promise<void> => {
  try {
    // Clear any pending auto-save
    clearAutoSave();
    
    // Delete session from database
    await workSessionRepo.deleteWorkSession();
    
  } catch (error) {
    console.error('Failed to clear session:', error);
    throw new Error('Failed to clear work session');
  }
};

/**
 * Gets information about the current session without loading full data
 * Useful for displaying session info in UI
 * 
 * @returns Promise that resolves to session metadata or null
 */
export const getSessionInfo = async (): Promise<{
  imageName: string;
  markerCount: number;
  createdAt: Date;
  lastUpdated: Date;
  hasUnsavedChanges: boolean;
} | null> => {
  try {
    const metadata = await workSessionRepo.getWorkSessionMetadata();
    if (!metadata) return null;
    
    // Check if there are unsaved changes by comparing with auto-save timeout
    const hasUnsavedChanges = autoSaveTimeoutId !== null;
    
    return {
      imageName: metadata.imageName,
      markerCount: metadata.markerCount,
      createdAt: new Date(metadata.createdAt),
      lastUpdated: new Date(metadata.lastUpdated),
      hasUnsavedChanges,
    };
    
  } catch (error) {
    console.error('Failed to get session info:', error);
    return null;
  }
};

/**
 * Checks if there's an existing session that can be restored
 * 
 * @returns Promise that resolves to true if session exists
 */
export const hasExistingSession = async (): Promise<boolean> => {
  try {
    return await workSessionRepo.workSessionExists();
  } catch (error) {
    console.error('Failed to check existing session:', error);
    return false;
  }
};

/**
 * Forces an immediate save of the current session state
 * Use this before critical operations or when user explicitly saves
 * 
 * @param image - Current image element
 * @param imageName - Image filename
 * @param markers - Current markers
 * @param canvasDimensions - Current canvas dimensions
 * @returns Promise that resolves when save is complete
 */
export const forceSave = async (
  image: HTMLImageElement,
  imageName: string,
  markers: Marker[],
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  try {
    // Clear any pending auto-save
    clearAutoSave();
    
    // Convert image to base64
    const imageData = imageToBase64(image);
    
    // Save complete session
    await workSessionRepo.saveWorkSession(imageData, imageName, markers, canvasDimensions);
    
  } catch (error) {
    console.error('Force save failed:', error);
    throw new Error('Failed to save work session');
  }
};

/**
 * Gets the time since last save
 * Useful for showing "last saved" information to users
 * 
 * @returns Promise that resolves to minutes since last save or null
 */
export const getTimeSinceLastSave = async (): Promise<number | null> => {
  try {
    const metadata = await workSessionRepo.getWorkSessionMetadata();
    if (!metadata) return null;
    
    const now = Date.now();
    const diffMs = now - metadata.lastUpdated;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    return diffMinutes;
    
  } catch (error) {
    console.error('Failed to get time since last save:', error);
    return null;
  }
};

/**
 * Exports current session data for backup or sharing
 * 
 * @returns Promise that resolves to export data object
 */
export const exportSession = async (): Promise<{
  imageName: string;
  imageData: string;
  markers: Marker[];
  canvasDimensions: CanvasDimensions;
  exportDate: string;
  version: number;
} | null> => {
  try {
    const session = await workSessionRepo.loadWorkSession();
    if (!session) return null;
    
    return {
      imageName: session.imageName,
      imageData: session.imageData,
      markers: session.markers,
      canvasDimensions: session.canvasDimensions,
      exportDate: new Date().toISOString(),
      version: 1,
    };
    
  } catch (error) {
    console.error('Session export failed:', error);
    throw new Error('Failed to export session');
  }
};

/**
 * Imports session data from an export file
 * 
 * @param exportData - Session export data
 * @returns Promise that resolves when import is complete
 */
export const importSession = async (exportData: {
  imageName: string;
  imageData: string;
  markers: Marker[];
  canvasDimensions: CanvasDimensions;
  exportDate: string;
  version: number;
}): Promise<void> => {
  try {
    // Validate import data
    if (!exportData.imageData || !exportData.markers || !exportData.canvasDimensions) {
      throw new Error('Invalid session export data');
    }
    
    // Save imported session
    await workSessionRepo.saveWorkSession(
      exportData.imageData,
      exportData.imageName,
      exportData.markers,
      exportData.canvasDimensions
    );
    
  } catch (error) {
    console.error('Session import failed:', error);
    throw new Error('Failed to import session');
  }
};

/**
 * Clears any pending auto-save operation
 * Private utility function
 */
const clearAutoSave = (): void => {
  if (autoSaveTimeoutId !== null) {
    clearTimeout(autoSaveTimeoutId);
    autoSaveTimeoutId = null;
  }
};

/**
 * Cleanup function to be called when the application shuts down
 * Ensures any pending saves are completed and resources are cleaned up
 */
export const cleanup = (): void => {
  clearAutoSave();
};