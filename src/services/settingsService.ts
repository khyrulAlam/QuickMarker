import { type MarkerSettings } from '@/lib/types';
import * as userSettingsRepo from '@/db/repositories/userSettingsRepository';

/**
 * Settings Service
 * 
 * High-level business logic layer for managing user settings.
 * This service sits between the UI components and the repository layer,
 * providing a clean API for settings operations and handling business rules.
 * 
 * Key responsibilities:
 * - Provide high-level settings operations for UI components
 * - Handle settings validation and business logic
 * - Coordinate between repository and application state
 * - Manage settings synchronization and error handling
 * - Abstract database implementation details from UI layer
 */

/**
 * Initializes settings system and loads user preferences
 * This should be called when the application starts
 * 
 * @returns Promise that resolves to the user's settings (or defaults)
 */
export const initializeSettings = async (): Promise<MarkerSettings> => {
  try {
    // Load settings from IndexedDB or get defaults if none exist
    const settings = await userSettingsRepo.loadUserSettings();
    
    // Here we could add business logic like:
    // - Settings validation
    // - Migration from old versions
    // - Analytics tracking
    // - Feature flag checks
    
    return settings;
  } catch (error) {
    console.error('Settings initialization failed:', error);
    // Return defaults to ensure app continues working
    return await userSettingsRepo.loadUserSettings();
  }
};

/**
 * Updates user settings with new values
 * Validates input and persists to storage
 * 
 * @param newSettings - Partial or complete settings object
 * @returns Promise that resolves when settings are saved
 * @throws Error if validation fails or save operation fails
 */
export const updateSettings = async (
  newSettings: Partial<MarkerSettings>
): Promise<void> => {
  try {
    // Validate settings before saving
    const validatedSettings = validateSettings(newSettings);
    
    // Save to database
    await userSettingsRepo.updateUserSettings(validatedSettings);
    
    // Here we could add:
    // - Analytics tracking for settings changes
    // - Notifications to other parts of the app
    // - Cloud sync coordination (future feature)
    
  } catch (error) {
    console.error('Settings update failed:', error);
    throw new Error('Failed to update settings');
  }
};

/**
 * Saves complete settings configuration
 * Use this when replacing all settings at once
 * 
 * @param settings - Complete settings object
 * @returns Promise that resolves when settings are saved
 * @throws Error if validation fails or save operation fails
 */
export const saveSettings = async (settings: MarkerSettings): Promise<void> => {
  try {
    // Validate complete settings object
    const validatedSettings = validateCompleteSettings(settings);
    
    // Save to database
    await userSettingsRepo.saveUserSettings(validatedSettings);
    
  } catch (error) {
    console.error('Settings save failed:', error);
    throw new Error('Failed to save settings');
  }
};

/**
 * Resets settings to default values
 * This provides a clean way to restore defaults from the UI
 * 
 * @returns Promise that resolves to the default settings
 * @throws Error if reset operation fails
 */
export const resetToDefaults = async (): Promise<MarkerSettings> => {
  try {
    await userSettingsRepo.resetUserSettings();
    
    // Return the defaults for immediate UI update
    return await userSettingsRepo.loadUserSettings();
    
  } catch (error) {
    console.error('Settings reset failed:', error);
    throw new Error('Failed to reset settings');
  }
};

/**
 * Gets current settings without affecting any state
 * Useful for one-off reads or validation
 * 
 * @returns Promise that resolves to current settings
 */
export const getCurrentSettings = async (): Promise<MarkerSettings> => {
  return await userSettingsRepo.loadUserSettings();
};

/**
 * Checks if user has customized their settings
 * Returns true if settings differ from defaults
 * 
 * @returns Promise that resolves to true if settings are customized
 */
export const hasCustomSettings = async (): Promise<boolean> => {
  try {
    const exists = await userSettingsRepo.userSettingsExist();
    return exists;
  } catch (error) {
    console.error('Failed to check custom settings:', error);
    return false;
  }
};

/**
 * Gets information about when settings were last modified
 * 
 * @returns Promise that resolves to metadata or null if no settings exist
 */
export const getSettingsInfo = async (): Promise<{
  lastUpdated: Date;
  hasCustomizations: boolean;
} | null> => {
  try {
    const metadata = await userSettingsRepo.getUserSettingsMetadata();
    if (!metadata) return null;
    
    return {
      lastUpdated: new Date(metadata.lastUpdated),
      hasCustomizations: true,
    };
  } catch (error) {
    console.error('Failed to get settings info:', error);
    return null;
  }
};

/**
 * Validates partial settings object
 * Ensures all provided values are valid
 * 
 * @param settings - Partial settings to validate
 * @returns Validated settings object
 * @throws Error if validation fails
 */
const validateSettings = (settings: Partial<MarkerSettings>): Partial<MarkerSettings> => {
  const validated = { ...settings };
  
  // Validate shape
  if (validated.shape && !['circle', 'square'].includes(validated.shape)) {
    throw new Error('Invalid marker shape');
  }
  
  // Validate size
  if (validated.size !== undefined) {
    if (typeof validated.size !== 'number' || validated.size < 5 || validated.size > 100) {
      throw new Error('Marker size must be between 5 and 100');
    }
  }
  
  // Validate colors (basic hex format check)
  if (validated.color && !isValidColor(validated.color)) {
    throw new Error('Invalid marker color format');
  }
  
  if (validated.borderColor && !isValidColor(validated.borderColor)) {
    throw new Error('Invalid border color format');
  }
  
  if (validated.textColor && !isValidColor(validated.textColor)) {
    throw new Error('Invalid text color format');
  }
  
  if (validated.countColor && !isValidColor(validated.countColor)) {
    throw new Error('Invalid count color format');
  }
  
  // Validate opacity
  if (validated.opacity !== undefined) {
    if (typeof validated.opacity !== 'number' || validated.opacity < 0 || validated.opacity > 100) {
      throw new Error('Opacity must be between 0 and 100');
    }
  }
  
  // Validate border size
  if (validated.borderSize !== undefined) {
    if (typeof validated.borderSize !== 'number' || validated.borderSize < 0 || validated.borderSize > 10) {
      throw new Error('Border size must be between 0 and 10');
    }
  }
  
  // Validate font sizes
  if (validated.fontSize !== undefined) {
    if (typeof validated.fontSize !== 'number' || validated.fontSize < 8 || validated.fontSize > 72) {
      throw new Error('Font size must be between 8 and 72');
    }
  }
  
  if (validated.countFontSize !== undefined) {
    if (typeof validated.countFontSize !== 'number' || validated.countFontSize < 8 || validated.countFontSize > 72) {
      throw new Error('Count font size must be between 8 and 72');
    }
  }
  
  // Validate count start
  if (validated.countStartFrom !== undefined) {
    if (typeof validated.countStartFrom !== 'number' || validated.countStartFrom < 0 || validated.countStartFrom > 999) {
      throw new Error('Count start value must be between 0 and 999');
    }
  }
  
  return validated;
};

/**
 * Validates a complete settings object
 * Ensures all required properties are present and valid
 * 
 * @param settings - Complete settings to validate
 * @returns Validated settings object
 * @throws Error if validation fails
 */
const validateCompleteSettings = (settings: MarkerSettings): MarkerSettings => {
  // Check that all required properties exist
  const requiredProps = [
    'shape', 'size', 'color', 'borderSize', 'borderColor', 'opacity',
    'text', 'textColor', 'fontSize', 'showText', 'showCount',
    'countColor', 'countFontSize', 'countStartFrom'
  ];
  
  for (const prop of requiredProps) {
    if (!(prop in settings)) {
      throw new Error(`Missing required setting: ${prop}`);
    }
  }
  
  // Validate using the partial validation logic
  const validated = validateSettings(settings) as MarkerSettings;
  
  return validated;
};

/**
 * Validates color format (basic hex check)
 * 
 * @param color - Color string to validate
 * @returns True if color format is valid
 */
const isValidColor = (color: string): boolean => {
  // Basic hex color validation
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * Exports settings to a JSON object
 * Useful for backup or sharing configurations
 * 
 * @returns Promise that resolves to settings export object
 */
export const exportSettings = async (): Promise<{
  settings: MarkerSettings;
  exportDate: string;
  version: number;
}> => {
  try {
    const settings = await getCurrentSettings();
    
    return {
      settings,
      exportDate: new Date().toISOString(),
      version: 1,
    };
  } catch (error) {
    console.error('Settings export failed:', error);
    throw new Error('Failed to export settings');
  }
};

/**
 * Imports settings from a JSON object
 * Validates and saves the imported settings
 * 
 * @param exportData - Settings export object
 * @returns Promise that resolves when import is complete
 * @throws Error if validation or import fails
 */
export const importSettings = async (exportData: {
  settings: MarkerSettings;
  exportDate: string;
  version: number;
}): Promise<void> => {
  try {
    // Validate import data structure
    if (!exportData.settings || typeof exportData.settings !== 'object') {
      throw new Error('Invalid import data: missing settings');
    }
    
    // Validate and save the imported settings
    await saveSettings(exportData.settings);
    
  } catch (error) {
    console.error('Settings import failed:', error);
    throw new Error('Failed to import settings');
  }
};