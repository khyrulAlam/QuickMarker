import { type Marker, type MarkerSettings, type CanvasDimensions } from '@/lib/types';

/**
 * Database schema definitions for QuickMark IndexedDB storage
 * 
 * This file defines the structure of our two main tables:
 * 1. UserSettings - Global user preferences for marker styling
 * 2. WorkSession - Current annotation project data (image + markers)
 */

// Database configuration constants
export const DB_NAME = 'QuickMarkDB';
export const DB_VERSION = 1;

// Object store names
export const STORES = {
  USER_SETTINGS: 'userSettings',
  WORK_SESSION: 'workSession',
} as const;

/**
 * UserSettings Table Schema
 * 
 * Purpose: Store user's preferred marker settings that persist across all sessions
 * Frequency: Updated only when user modifies settings in the UI
 * Lifecycle: Never automatically cleared, survives browser restarts
 */
export interface UserSettingsRecord {
  /** Primary key - always 'default' since we store one settings record */
  id: 'default';
  
  /** Complete marker settings configuration */
  markerSettings: MarkerSettings;
  
  /** Timestamp when settings were last modified */
  lastUpdated: number;
  
  /** Version for future schema migrations */
  version: number;
}

/**
 * WorkSession Table Schema
 * 
 * Purpose: Store current annotation project (image + all markers)
 * Frequency: Auto-saved every 2 seconds during active annotation work
 * Lifecycle: Cleared when user uploads a new image
 */
export interface WorkSessionRecord {
  /** Primary key - always 'current' since we store one active session */
  id: 'current';
  
  /** Base64 encoded image data for restoration */
  imageData: string;
  
  /** Original filename for user reference */
  imageName: string;
  
  /** Array of all placed markers with their complete configuration */
  markers: Marker[];
  
  /** Canvas dimensions when session was saved */
  canvasDimensions: CanvasDimensions;
  
  /** Timestamp when session was created */
  createdAt: number;
  
  /** Timestamp when session was last saved */
  lastUpdated: number;
  
  /** Version for future schema migrations */
  version: number;
}

/**
 * IndexedDB Object Store Configurations
 * 
 * Defines the structure and indexes for each table
 */
export const STORE_CONFIGS = {
  [STORES.USER_SETTINGS]: {
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'lastUpdated', keyPath: 'lastUpdated', unique: false }
    ]
  },
  [STORES.WORK_SESSION]: {
    keyPath: 'id', 
    autoIncrement: false,
    indexes: [
      { name: 'lastUpdated', keyPath: 'lastUpdated', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ]
  }
} as const;

/**
 * Default user settings for new installations
 * 
 * These values are used when no saved settings exist in the database
 */
export const DEFAULT_USER_SETTINGS: MarkerSettings = {
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
};