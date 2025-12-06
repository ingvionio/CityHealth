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

    // Create heatmap layer
    const heatmapLayer = new HeatmapLayer({
      source: vectorSource,
      blur: 20,
      radius: 15,
      // Weight function based on mark parameter (0-5)
      weight: function (feature) {
        const mark = feature.get('mark');
        // If mark is null, undefined, or 0, use a minimal weight
        if (mark === null || mark === undefined || mark === 0) {
          return 0.1; // Minimal visibility for points without marks
        }
        // Normalize mark (0-5) to (0-1) range
        // Higher mark = more weight = more intense color
        return Math.min(mark / 5, 1);
      },
      // Custom gradient from blue (low) to red (high)
      gradient: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
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

