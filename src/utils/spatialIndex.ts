import { type Marker } from '@/lib/types';

/**
 * Spatial Index for Efficient Marker Collision Detection
 * 
 * Implements a simple grid-based spatial partitioning system to optimize
 * marker collision detection from O(n) to approximately O(1) average case.
 * This dramatically improves performance when dealing with many markers.
 */

interface GridCell {
  markers: Marker[];
}

interface SpatialIndexConfig {
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export class SpatialIndex {
  private grid: Map<string, GridCell> = new Map();
  private config: SpatialIndexConfig;
  private gridCols: number;
  private gridRows: number;

  constructor(config: SpatialIndexConfig) {
    this.config = config;
    this.gridCols = Math.ceil(config.canvasWidth / config.cellSize);
    this.gridRows = Math.ceil(config.canvasHeight / config.cellSize);
  }

  /**
   * Updates the spatial index configuration when canvas dimensions change
   */
  updateDimensions(canvasWidth: number, canvasHeight: number): void {
    this.config.canvasWidth = canvasWidth;
    this.config.canvasHeight = canvasHeight;
    this.gridCols = Math.ceil(canvasWidth / this.config.cellSize);
    this.gridRows = Math.ceil(canvasHeight / this.config.cellSize);
    
    // Rebuild index with new dimensions
    const allMarkers = this.getAllMarkers();
    this.clear();
    this.addMarkers(allMarkers);
  }

  /**
   * Converts world coordinates to grid coordinates
   */
  private getGridCoords(x: number, y: number): { col: number; row: number } {
    return {
      col: Math.floor(x / this.config.cellSize),
      row: Math.floor(y / this.config.cellSize),
    };
  }

  /**
   * Converts grid coordinates to cell key
   */
  private getCellKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  /**
   * Gets all grid cells that a marker might occupy (including overlap)
   */
  private getMarkerCells(marker: Marker): string[] {
    const radius = marker.size / 2;
    const { col: minCol, row: minRow } = this.getGridCoords(marker.x - radius, marker.y - radius);
    const { col: maxCol, row: maxRow } = this.getGridCoords(marker.x + radius, marker.y + radius);
    
    const cells: string[] = [];
    
    for (let col = Math.max(0, minCol); col <= Math.min(this.gridCols - 1, maxCol); col++) {
      for (let row = Math.max(0, minRow); row <= Math.min(this.gridRows - 1, maxRow); row++) {
        cells.push(this.getCellKey(col, row));
      }
    }
    
    return cells;
  }

  /**
   * Adds a marker to the spatial index
   */
  addMarker(marker: Marker): void {
    const cells = this.getMarkerCells(marker);
    
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, { markers: [] });
      }
      
      const cell = this.grid.get(cellKey)!;
      
      // Avoid duplicates
      if (!cell.markers.find(m => m.id === marker.id)) {
        cell.markers.push(marker);
      }
    });
  }

  /**
   * Removes a marker from the spatial index
   */
  removeMarker(markerId: string): void {
    this.grid.forEach(cell => {
      cell.markers = cell.markers.filter(m => m.id !== markerId);
    });
    
    // Clean up empty cells to prevent memory leaks
    const emptyCells: string[] = [];
    this.grid.forEach((cell, key) => {
      if (cell.markers.length === 0) {
        emptyCells.push(key);
      }
    });
    
    emptyCells.forEach(key => {
      this.grid.delete(key);
    });
  }

  /**
   * Updates marker position in the index
   */
  updateMarker(marker: Marker): void {
    this.removeMarker(marker.id);
    this.addMarker(marker);
  }

  /**
   * Adds multiple markers efficiently
   */
  addMarkers(markers: Marker[]): void {
    markers.forEach(marker => this.addMarker(marker));
  }

  /**
   * Rebuilds the entire index with new markers
   */
  rebuildIndex(markers: Marker[]): void {
    this.clear();
    this.addMarkers(markers);
  }

  /**
   * Finds the marker at a specific position (optimized collision detection)
   */
  getMarkerAtPosition(x: number, y: number): Marker | null {
    const { col, row } = this.getGridCoords(x, y);
    const cellKey = this.getCellKey(col, row);
    
    const cell = this.grid.get(cellKey);
    if (!cell) return null;
    
    // Check markers in this cell for actual collision
    for (const marker of cell.markers) {
      const distance = Math.sqrt(
        Math.pow(x - marker.x, 2) + Math.pow(y - marker.y, 2)
      );
      
      if (distance <= marker.size / 2) {
        return marker;
      }
    }
    
    return null;
  }

  /**
   * Gets all markers in a rectangular region
   */
  getMarkersInRegion(x: number, y: number, width: number, height: number): Marker[] {
    const { col: minCol, row: minRow } = this.getGridCoords(x, y);
    const { col: maxCol, row: maxRow } = this.getGridCoords(x + width, y + height);
    
    const foundMarkers = new Set<Marker>();
    
    for (let col = Math.max(0, minCol); col <= Math.min(this.gridCols - 1, maxCol); col++) {
      for (let row = Math.max(0, minRow); row <= Math.min(this.gridRows - 1, maxRow); row++) {
        const cellKey = this.getCellKey(col, row);
        const cell = this.grid.get(cellKey);
        
        if (cell) {
          cell.markers.forEach(marker => {
            // Check if marker actually intersects with the region
            if (marker.x >= x && marker.x <= x + width &&
                marker.y >= y && marker.y <= y + height) {
              foundMarkers.add(marker);
            }
          });
        }
      }
    }
    
    return Array.from(foundMarkers);
  }

  /**
   * Gets all markers in the index
   */
  getAllMarkers(): Marker[] {
    const allMarkers = new Set<Marker>();
    
    this.grid.forEach(cell => {
      cell.markers.forEach(marker => {
        allMarkers.add(marker);
      });
    });
    
    return Array.from(allMarkers);
  }

  /**
   * Clears the entire index
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Gets index statistics for debugging and optimization
   */
  getStats(): {
    totalCells: number;
    occupiedCells: number;
    totalMarkers: number;
    averageMarkersPerCell: number;
    maxMarkersInCell: number;
  } {
    const occupiedCells = this.grid.size;
    const totalMarkers = this.getAllMarkers().length;
    
    let maxMarkersInCell = 0;
    let totalMarkerInstances = 0;
    
    this.grid.forEach(cell => {
      maxMarkersInCell = Math.max(maxMarkersInCell, cell.markers.length);
      totalMarkerInstances += cell.markers.length;
    });
    
    return {
      totalCells: this.gridCols * this.gridRows,
      occupiedCells,
      totalMarkers,
      averageMarkersPerCell: occupiedCells > 0 ? totalMarkerInstances / occupiedCells : 0,
      maxMarkersInCell,
    };
  }
}

/**
 * Factory function to create an optimized spatial index
 */
export const createSpatialIndex = (canvasWidth: number, canvasHeight: number): SpatialIndex => {
  // Optimize cell size based on canvas dimensions
  // Larger canvases get larger cells to prevent excessive grid overhead
  const cellSize = Math.max(50, Math.min(200, Math.sqrt(canvasWidth * canvasHeight) / 20));
  
  return new SpatialIndex({
    cellSize,
    canvasWidth,
    canvasHeight,
  });
};

/**
 * Optimized marker collision detection using spatial indexing
 * Drop-in replacement for the original getMarkerAtPosition function
 */
export const getMarkerAtPositionOptimized = (
  x: number,
  y: number,
  spatialIndex: SpatialIndex
): Marker | null => {
  return spatialIndex.getMarkerAtPosition(x, y);
};