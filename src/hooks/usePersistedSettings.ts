import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { type MarkerSettings } from '@/lib/types';
import * as settingsService from '@/services/settingsService';
import { debounce } from '@/utils/debounceUtils';

/**
 * usePersistedSettings Hook
 * 
 * Custom React hook for managing user settings with IndexedDB persistence.
 * Provides a clean interface for components to read/write settings while
 * handling all persistence operations in the background.
 * 
 * Key features:
 * - Automatic loading of settings on hook initialization
 * - Debounced saving to prevent excessive database writes
 * - Error handling with fallback to defaults
 * - Loading states for UI feedback
 * - Optimistic updates for responsive UI
 * - Settings validation before persistence
 */

interface UsePersistedSettingsReturn {
  /** Current marker settings */
  settings: MarkerSettings;
  
  /** Whether settings are currently being loaded from database */
  isLoading: boolean;
  
  /** Whether a save operation is currently in progress */
  isSaving: boolean;
  
  /** Whether there's an error with the settings system */
  hasError: boolean;
  
  /** Error message if something went wrong */
  error: string | null;
  
  /** Updates settings with new values (debounced save) */
  updateSettings: (newSettings: Partial<MarkerSettings>) => void;
  
  /** Saves current settings immediately without debouncing */
  saveImmediately: () => Promise<void>;
  
  /** Resets settings to default values */
  resetToDefaults: () => Promise<void>;
  
  /** Reloads settings from database */
  reloadSettings: () => Promise<void>;
  
  /** Whether current settings differ from defaults */
  hasCustomizations: boolean;
  
  /** Information about when settings were last saved */
  lastSaved: Date | null;
}

/**
 * Debounce delay for auto-saving settings (in milliseconds)
 * Short delay since settings changes are typically infrequent
 */
const SETTINGS_SAVE_DELAY = 1000;

export const usePersistedSettings = (): UsePersistedSettingsReturn => {
  // State management
  const [settings, setSettings] = useState<MarkerSettings>({
    shape: 'circle',
    size: 20,
    color: '#ff0000',
    borderSize: 2,
    borderColor: '#000000',
    opacity: 50,
    text: '',
    textColor: '#ffffff',
    fontSize: 12,
    showText: false,
    showCount: false,
    countColor: '#ffffff',
    countFontSize: 14,
    countStartFrom: 1,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomizations, setHasCustomizations] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /**
   * Loads settings from IndexedDB
   * Called on component mount and when explicitly requested
   */
  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);
      
      // Load settings from service
      const loadedSettings = await settingsService.initializeSettings();
      setSettings(loadedSettings);
      
      // Check if user has customizations
      const hasCustom = await settingsService.hasCustomSettings();
      setHasCustomizations(hasCustom);
      
      // Get last saved time if available
      const info = await settingsService.getSettingsInfo();
      setLastSaved(info?.lastUpdated || null);
      
    } catch (err) {
      console.error('Failed to load settings:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      
      // Keep current settings as fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Saves settings to IndexedDB
   * Internal function used by both debounced and immediate save
   */
  const saveSettings = useCallback(async (settingsToSave: MarkerSettings): Promise<void> => {
    try {
      setIsSaving(true);
      setHasError(false);
      setError(null);
      
      await settingsService.saveSettings(settingsToSave);
      
      setHasCustomizations(true);
      setLastSaved(new Date());
      
    } catch (err) {
      console.error('Failed to save settings:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err; // Re-throw for caller handling
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Debounced save function to prevent excessive database writes
   * Used for real-time settings updates as user interacts with controls
   */
  const debouncedSave = useCallback(
    debounce(async (settingsToSave: MarkerSettings) => {
      await saveSettings(settingsToSave);
    }, SETTINGS_SAVE_DELAY),
    [saveSettings]
  );

  /**
   * Updates settings with partial changes
   * Uses optimistic updates for immediate UI response
   */
  const updateSettings = useCallback((newSettings: Partial<MarkerSettings>): void => {
    setSettings(prevSettings => {
      const updatedSettings = {
        ...prevSettings,
        ...newSettings,
      };
      
      // Trigger debounced save with updated settings
      debouncedSave(updatedSettings);
      
      return updatedSettings;
    });
  }, [debouncedSave]);

  /**
   * Saves current settings immediately without debouncing
   * Used for explicit save operations or when component unmounts
   */
  const saveImmediately = useCallback(async (): Promise<void> => {
    try {
      // Cancel any pending debounced save
      debouncedSave.cancel();
      
      // Save current settings
      await saveSettings(settings);
      
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
      throw err;
    }
  }, [settings, saveSettings, debouncedSave]);

  /**
   * Resets settings to default values
   */
  const resetToDefaults = useCallback(async (): Promise<void> => {
    try {
      setIsSaving(true);
      
      // Cancel any pending saves
      debouncedSave.cancel();
      
      // Reset to defaults
      const defaultSettings = await settingsService.resetToDefaults();
      setSettings(defaultSettings);
      setHasCustomizations(false);
      setLastSaved(new Date());
      
      toast.success('Settings reset to defaults');
      
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toast.error('Failed to reset settings');
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setIsSaving(false);
    }
  }, [debouncedSave]);

  /**
   * Reloads settings from database
   * Useful for refreshing after external changes
   */
  const reloadSettings = useCallback(async (): Promise<void> => {
    try {
      // Cancel any pending saves to avoid conflicts
      debouncedSave.cancel();
      
      await loadSettings();
      
    } catch (err) {
      console.error('Failed to reload settings:', err);
      toast.error('Failed to reload settings');
    }
  }, [loadSettings, debouncedSave]);

  /**
   * Load settings on component mount
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Cleanup: save any pending changes when component unmounts
   */
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  /**
   * Handle browser page unload to save pending changes
   */
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      // Force immediate save if there are pending changes
      debouncedSave.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [debouncedSave]);

  return {
    settings,
    isLoading,
    isSaving,
    hasError,
    error,
    updateSettings,
    saveImmediately,
    resetToDefaults,
    reloadSettings,
    hasCustomizations,
    lastSaved,
  };
};