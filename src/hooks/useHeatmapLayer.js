import { useEffect, useState, useRef } from 'react';
import HeatmapLayer from 'ol/layer/Heatmap';

/**
 * Custom hook to create and manage a heatmap layer
 * @param {Map} map - OpenLayers map instance
 * @param {VectorSource} vectorSource - Vector source with point features
 * @returns {Object} - { heatmapLayer, isHeatmapVisible, toggleHeatmap }
 */
export const useHeatmapLayer = (map, vectorSource) => {
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);
  const heatmapLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !vectorSource) return;

    // Create heatmap layer with larger blur and radius for stronger merging
    const heatmapLayer = new HeatmapLayer({
      source: vectorSource,
      blur: 50,      // Larger blur for smoother blending
      radius: 40,    // Bigger radius for stronger coverage
      // Weight function based on mark parameter (0-5)
      // Only shows points with mark > 3
      weight: function (feature) {
        const mark = feature.get('mark');
        
        // Points with mark <= 3, null, undefined, or 0 are NOT displayed
        if (mark === null || mark === undefined || mark <= 3) {
          return 0; // Hidden - not displayed on heatmap
        }
        
        // Map mark from (3, 5] to weight (0, 1]
        // mark 3+ → weight ~0 (blue)
        // mark 4 → weight 0.5 (yellow)
        // mark 5 → weight 1 (green)
        const normalizedWeight = (mark - 3) / 2; // (3,5] maps to (0,1]
        return Math.min(Math.max(normalizedWeight, 0.01), 1); // Clamp to (0.01, 1]
      },
      // Custom gradient: blue (low/mark~3) → yellow (middle/mark~4) → green (high/mark~5)
      gradient: [
        '#2166ac', // Deep blue (weight 0, mark ~3)
        '#4393c3', // Medium blue
        '#92c5de', // Light blue
        '#d1e5f0', // Very light blue
        '#d9ef8b', // Light yellow/cream
        '#d9ef8b', // Yellow (weight 0.5, mark ~4)
        '#d9ef8b', // Yellow-green
        '#a6d96a', // Light green
        '#1a9850', // Medium green
        '#1a9850', // Green (weight 1, mark 5)
      ],
      visible: false, // Initially hidden
    });

    heatmapLayerRef.current = heatmapLayer;
    map.addLayer(heatmapLayer);

    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
    };
  }, [map, vectorSource]);

  // Function to toggle heatmap visibility
  const toggleHeatmap = () => {
    if (heatmapLayerRef.current) {
      const newVisibility = !isHeatmapVisible;
      heatmapLayerRef.current.setVisible(newVisibility);
      setIsHeatmapVisible(newVisibility);
    }
  };

  return {
    heatmapLayer: heatmapLayerRef.current,
    isHeatmapVisible,
    toggleHeatmap,
  };
};

