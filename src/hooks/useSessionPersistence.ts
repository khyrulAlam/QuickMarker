import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { type Marker, type CanvasDimensions } from '@/lib/types';
import * as sessionService from '@/services/sessionService';
import { createAutoSave } from '@/utils/debounceUtils';

/**
 * useSessionPersistence Hook
 * 
 * Custom React hook for managing work session persistence with IndexedDB.
 * Handles auto-save functionality, session restoration, and coordination
 * between the UI and the persistence layer.
 * 
 * Key features:
 * - Automatic session restoration on app initialization
 * - Auto-save with configurable debouncing (2 seconds)
 * - Session lifecycle management (create, update, cleanup)
 * - Loading states and error handling
 * - Optimistic updates for responsive UI
 * - Session metadata and status tracking
 */

interface UseSessionPersistenceReturn {
  /** Whether session is being restored from database */
  isRestoring: boolean;
  
  /** Whether auto-save is currently in progress */
  isSaving: boolean;
  
  /** Whether there's an error with session persistence */
  hasError: boolean;
  
  /** Error message if something went wrong */
  error: string | null;
  
  /** Whether there are unsaved changes pending */
  hasPendingChanges: boolean;
  
  /** Time remaining until auto-save (in milliseconds) */
  timeUntilAutoSave: number | null;
  
  /** Information about current session */
  sessionInfo: {
    imageName?: string;
    markerCount: number;
    createdAt?: Date;
    lastSaved?: Date;
  } | null;
  
  /** Initializes session system and restores previous work if available */
  initializeSession: () => Promise<{
    image: HTMLImageElement;
    imageName: string;
    markers: Marker[];
    canvasDimensions: CanvasDimensions;
  } | null>;
  
  /** Creates new session when new image is uploaded */
  createNewSession: (
    image: HTMLImageElement,
    imageName: string,
    canvasDimensions: CanvasDimensions
  ) => Promise<void>;
  
  /** Updates markers in current session (triggers auto-save) */
  updateMarkers: (markers: Marker[]) => void;
  
  /** Updates canvas dimensions in current session */
  updateCanvasDimensions: (dimensions: CanvasDimensions) => Promise<void>;
  
  /** Forces immediate save of current state */
  saveImmediately: (
    image: HTMLImageElement,
    imageName: string,
    markers: Marker[],
    canvasDimensions: CanvasDimensions
  ) => Promise<void>;
  
  /** Clears current session (called on new image upload) */
  clearSession: () => Promise<void>;
  
  /** Checks if there's an existing session */
  hasExistingSession: () => Promise<boolean>;
  
  /** Gets time since last save in minutes */
  getTimeSinceLastSave: () => Promise<number | null>;
}

export const useSessionPersistence = (): UseSessionPersistenceReturn => {
  // State management
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [timeUntilAutoSave, setTimeUntilAutoSave] = useState<number | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    imageName?: string;
    markerCount: number;
    createdAt?: Date;
    lastSaved?: Date;
  } | null>(null);

  // Auto-save timer refs
  const autoSaveRef = useRef<ReturnType<typeof createAutoSave> | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  /**
   * Updates session metadata
   */
  const updateSessionInfo = useCallback(async (): Promise<void> => {
    try {
      const info = await sessionService.getSessionInfo();
      if (info) {
        setSessionInfo({
          imageName: info.imageName,
          markerCount: info.markerCount,
          createdAt: info.createdAt,
          lastSaved: info.lastUpdated,
        });
      } else {
        setSessionInfo(null);
      }
    } catch (err) {
      console.error('Failed to update session info:', err);
    }
  }, []);

  /**
   * Updates the time until auto-save counter
   */
  const updateTimeCounter = useCallback((): void => {
    if (autoSaveRef.current) {
      const timeRemaining = autoSaveRef.current.getTimeUntilSave();
      setTimeUntilAutoSave(timeRemaining);
      setHasPendingChanges(autoSaveRef.current.isPending());
    } else {
      setTimeUntilAutoSave(null);
      setHasPendingChanges(false);
    }
  }, []);

  /**
   * Starts the time counter update interval
   */
  const startTimeCounter = useCallback((): void => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    
    timeUpdateIntervalRef.current = window.setInterval(updateTimeCounter, 100);
  }, [updateTimeCounter]);

  /**
   * Stops the time counter update interval
   */
  const stopTimeCounter = useCallback((): void => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
    setTimeUntilAutoSave(null);
    setHasPendingChanges(false);
  }, []);

  /**
   * Creates auto-save function for markers
   */
  const createMarkerAutoSave = useCallback(() => {
    return createAutoSave(
      async (markers: Marker[]) => {
        try {
          setIsSaving(true);
          setHasError(false);
          setError(null);
          
          await sessionService.saveSessionMarkers(markers);
          await updateSessionInfo();
          
        } catch (err) {
          console.error('Auto-save failed:', err);
          setHasError(true);
          setError(err instanceof Error ? err.message : 'Auto-save failed');
        } finally {
          setIsSaving(false);
          stopTimeCounter();
        }
      },
      2000 // 2 seconds as specified
    );
  }, [updateSessionInfo, stopTimeCounter]);

  /**
   * Initializes session and restores previous work
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsRestoring(true);
      setHasError(false);
      setError(null);
      
      const restoredSession = await sessionService.initializeSession();
      
      if (restoredSession) {
        await updateSessionInfo();
        // Delay toast to prevent visual glitch during initial render
        setTimeout(() => {
          toast.success('Previous work restored');
        }, 300);
      }
      
      return restoredSession;
      
    } catch (err) {
      console.error('Session initialization failed:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to restore session');
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [updateSessionInfo]);

  /**
   * Creates new session for uploaded image
   */
  const createNewSession = useCallback(async (
    image: HTMLImageElement,
    imageName: string,
    canvasDimensions: CanvasDimensions
  ): Promise<void> => {
    try {
      setHasError(false);
      setError(null);
      
      // Clear any existing auto-save
      if (autoSaveRef.current) {
        autoSaveRef.current.cancel();
      }
      stopTimeCounter();
      
      await sessionService.createNewSession(image, imageName, canvasDimensions);
      await updateSessionInfo();
      
      // Create new auto-save instance
      autoSaveRef.current = createMarkerAutoSave();
      
    } catch (err) {
      console.error('Failed to create new session:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  }, [updateSessionInfo, createMarkerAutoSave, stopTimeCounter]);

  /**
   * Updates markers with auto-save
   */
  const updateMarkers = useCallback((markers: Marker[]): void => {
    try {
      setHasError(false);
      setError(null);
      
      if (!autoSaveRef.current) {
        autoSaveRef.current = createMarkerAutoSave();
      }
      
      // Update session info optimistically
      setSessionInfo(prev => prev ? {
        ...prev,
        markerCount: markers.length,
      } : null);
      
      // Trigger auto-save
      autoSaveRef.current.save(markers);
      startTimeCounter();
      
    } catch (err) {
      console.error('Failed to update markers:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to update markers');
    }
  }, [createMarkerAutoSave, startTimeCounter]);

  /**
   * Updates canvas dimensions
   */
  const updateCanvasDimensions = useCallback(async (
    dimensions: CanvasDimensions
  ): Promise<void> => {
    try {
      setHasError(false);
      setError(null);
      
      await sessionService.updateSessionDimensions(dimensions);
      
    } catch (err) {
      console.error('Failed to update canvas dimensions:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to update dimensions');
    }
  }, []);

  /**
   * Forces immediate save
   */
  const saveImmediately = useCallback(async (
    image: HTMLImageElement,
    imageName: string,
    markers: Marker[],
    canvasDimensions: CanvasDimensions
  ): Promise<void> => {
    try {
      setIsSaving(true);
      setHasError(false);
      setError(null);
      
      // Cancel pending auto-save
      if (autoSaveRef.current) {
        autoSaveRef.current.cancel();
      }
      stopTimeCounter();
      
      await sessionService.forceSave(image, imageName, markers, canvasDimensions);
      await updateSessionInfo();
      
      toast.success('Session saved');
      
    } catch (err) {
      console.error('Immediate save failed:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to save session');
      toast.error('Failed to save session');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [updateSessionInfo, stopTimeCounter]);

  /**
   * Clears current session
   */
  const clearSession = useCallback(async (): Promise<void> => {
    try {
      setHasError(false);
      setError(null);
      
      // Cancel any pending auto-save
      if (autoSaveRef.current) {
        autoSaveRef.current.cancel();
      }
      stopTimeCounter();
      
      await sessionService.clearSession();
      setSessionInfo(null);
      
    } catch (err) {
      console.error('Failed to clear session:', err);
      setHasError(true);
      setError(err instanceof Error ? err.message : 'Failed to clear session');
    }
  }, [stopTimeCounter]);

  /**
   * Checks for existing session
   */
  const hasExistingSession = useCallback(async (): Promise<boolean> => {
    try {
      return await sessionService.hasExistingSession();
    } catch (err) {
      console.error('Failed to check existing session:', err);
      return false;
    }
  }, []);

  /**
   * Gets time since last save
   */
  const getTimeSinceLastSave = useCallback(async (): Promise<number | null> => {
    try {
      return await sessionService.getTimeSinceLastSave();
    } catch (err) {
      console.error('Failed to get time since last save:', err);
      return null;
    }
  }, []);

  /**
   * Comprehensive cleanup on component unmount
   * Ensures all timers, intervals, and resources are properly disposed
   */
  useEffect(() => {
    return () => {
      try {
        // Cancel any pending auto-save operations
        if (autoSaveRef.current) {
          autoSaveRef.current.cancel();
          autoSaveRef.current = null;
        }
        
        // Stop time counter interval
        stopTimeCounter();
        
        // Clear all timer references
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
          timeUpdateIntervalRef.current = null;
        }
        
        // Clean up session service resources
        sessionService.cleanup();
        
        // Reset state to prevent memory leaks
        setSessionInfo(null);
        setHasPendingChanges(false);
        setTimeUntilAutoSave(null);
        
      } catch (error) {
        console.warn('Cleanup error in useSessionPersistence:', error);
      }
    };
  }, [stopTimeCounter]);

  /**
   * Handle page unload to save pending changes with better cleanup
   */
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      try {
        if (autoSaveRef.current && autoSaveRef.current.isPending()) {
          // Force save any pending changes
          autoSaveRef.current.flush();
          
          // Show warning for unsaved changes
          event.preventDefault();
          event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
      } catch (error) {
        console.warn('Before unload handler error:', error);
      }
    };

    const handleUnload = (): void => {
      // Final cleanup on actual unload
      try {
        if (autoSaveRef.current) {
          autoSaveRef.current.cancel();
        }
        stopTimeCounter();
      } catch (error) {
        console.warn('Unload cleanup error:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [stopTimeCounter]);

  return {
    isRestoring,
    isSaving,
    hasError,
    error,
    hasPendingChanges,
    timeUntilAutoSave,
    sessionInfo,
    initializeSession,
    createNewSession,
    updateMarkers,
    updateCanvasDimensions,
    saveImmediately,
    clearSession,
    hasExistingSession,
    getTimeSinceLastSave,
  };
};