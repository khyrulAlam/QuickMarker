import { type UserSettingsRecord, STORES, DEFAULT_USER_SETTINGS } from '../schema';
import { getObjectStore, promisifyRequest } from '../connection';
import { type MarkerSettings } from '@/lib/types';

/**
 * UserSettings Repository
 * 
 * Handles all CRUD operations for user marker settings in IndexedDB.
 * This repository manages the persistent storage of user preferences
 * that should survive browser sessions and page refreshes.
 * 
 * Key responsibilities:
 * - Save/load user marker preferences
 * - Provide default settings for new users
 * - Handle settings validation and error recovery
 * - Manage settings versioning for future migrations
 */

/**
 * Loads user marker settings from IndexedDB
 * Returns default settings if no saved settings exist
 * 
 * @returns Promise that resolves to the user's marker settings
 * @throws Error if database access fails
 */
export const loadUserSettings = async (): Promise<MarkerSettings> => {
  try {
    const store = await getObjectStore(STORES.USER_SETTINGS, 'readonly');
    const request = store.get('default');
    const result = await promisifyRequest(request);
    
    if (result) {
      // Validate that the loaded settings have all required properties
      const loadedSettings = result.markerSettings;
      
      // Merge with defaults to ensure all properties exist (handles schema evolution)
      const validatedSettings: MarkerSettings = {
        ...DEFAULT_USER_SETTINGS,
        ...loadedSettings,
      };
      
      return validatedSettings;
    } else {
      // No saved settings found, return defaults
      return { ...DEFAULT_USER_SETTINGS };
    }
  } catch (error) {
    console.error('Failed to load user settings from IndexedDB:', error);
    // Return defaults if loading fails to ensure app continues working
    return { ...DEFAULT_USER_SETTINGS };
  }
};

/**
 * Saves user marker settings to IndexedDB
 * Creates a new record or updates the existing one
 * 
 * @param settings - The marker settings to save
 * @returns Promise that resolves when settings are saved
 * @throws Error if database write fails
 */
export const saveUserSettings = async (settings: MarkerSettings): Promise<void> => {
  try {
    const store = await getObjectStore(STORES.USER_SETTINGS, 'readwrite');
    
    // Create the settings record with metadata
    const settingsRecord: UserSettingsRecord = {
      id: 'default',
      markerSettings: { ...settings }, // Create a copy to avoid mutations
      lastUpdated: Date.now(),
      version: 1, // For future schema migrations
    };
    
    const request = store.put(settingsRecord);
    await promisifyRequest(request);
    
  } catch (error) {
    console.error('Failed to save user settings to IndexedDB:', error);
    throw new Error('Settings save failed');
  }
};

/**
 * Updates specific marker setting properties
 * Loads current settings, merges changes, and saves back
 * 
 * @param partialSettings - Partial settings object with properties to update
 * @returns Promise that resolves when settings are updated
 * @throws Error if database operations fail
 */
export const updateUserSettings = async (
  partialSettings: Partial<MarkerSettings>
): Promise<void> => {
  try {
    // Load current settings
    const currentSettings = await loadUserSettings();
    
    // Merge with new settings
    const updatedSettings: MarkerSettings = {
      ...currentSettings,
      ...partialSettings,
    };
    
    // Save the merged settings
    await saveUserSettings(updatedSettings);
    
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw new Error('Settings update failed');
  }
};

/**
 * Resets user settings to default values
 * Useful for "Reset to Defaults" functionality
 * 
 * @returns Promise that resolves when settings are reset
 * @throws Error if database write fails
 */
export const resetUserSettings = async (): Promise<void> => {
  try {
    await saveUserSettings({ ...DEFAULT_USER_SETTINGS });
  } catch (error) {
    console.error('Failed to reset user settings:', error);
    throw new Error('Settings reset failed');
  }
};

/**
 * Deletes all user settings from the database
 * This completely removes the settings record
 * 
 * @returns Promise that resolves when settings are deleted
 * @throws Error if database operation fails
 */
export const deleteUserSettings = async (): Promise<void> => {
  try {
    const store = await getObjectStore(STORES.USER_SETTINGS, 'readwrite');
    const request = store.delete('default');
    await promisifyRequest(request);
    
  } catch (error) {
    console.error('Failed to delete user settings:', error);
    throw new Error('Settings deletion failed');
  }
};

/**
 * Checks if user settings exist in the database
 * Useful for determining if this is a first-time user
 * 
 * @returns Promise that resolves to true if settings exist, false otherwise
 */
export const userSettingsExist = async (): Promise<boolean> => {
  try {
    const store = await getObjectStore(STORES.USER_SETTINGS, 'readonly');
    const request = store.get('default');
    const result = await promisifyRequest(request);
    
    return result !== undefined;
    
  } catch (error) {
    console.error('Failed to check user settings existence:', error);
    // Assume settings don't exist if check fails
    return false;
  }
};

/**
 * Gets metadata about the user settings record
 * Returns information like when settings were last updated
 * 
 * @returns Promise that resolves to settings metadata or null if not found
 */
export const getUserSettingsMetadata = async (): Promise<{
  lastUpdated: number;
  version: number;
} | null> => {
  try {
    const store = await getObjectStore(STORES.USER_SETTINGS, 'readonly');
    const request = store.get('default');
    const result = await promisifyRequest(request);
    
    if (result) {
      return {
        lastUpdated: result.lastUpdated,
        version: result.version,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Failed to get user settings metadata:', error);
    return null;
  }
};