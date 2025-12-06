import { useEffect, useState } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import { clusterStyle } from '../utils/mapStyles';

export const useMapLayers = (map, mode) => {
  // Persist the actual data source across re-renders
  const [vectorSource] = useState(() => new VectorSource());

  useEffect(() => {
    if (!map) return;

    // Create the cluster source
    const clusterSource = new Cluster({
      distance: 10,
      source: vectorSource,
    });

    // In 'edit' or 'add' mode, we use the raw vectorSource to ensure direct interaction
    // In 'view' mode, we use the clusterSource for better visualization
    const isEditOrAdd = mode === 'edit' || mode === 'add';
    const layerSource = isEditOrAdd ? vectorSource : clusterSource;

    const vectorLayer = new VectorLayer({
      source: layerSource,
      style: clusterStyle,
    });

    map.addLayer(vectorLayer);

    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map, vectorSource, mode]);

  return vectorSource;
};
