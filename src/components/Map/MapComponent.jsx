import React, { useRef, useState } from 'react';
import { useMap } from '../../hooks/useMap';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapClick } from '../../hooks/useMapClick';
import { useMapContextMenu } from '../../hooks/useMapContextMenu';
import { MapControls } from './MapControls';
import Popup from './Popup';
import ContextMenu from './ContextMenu';
import AddPointModal from './AddPointModal';
import SearchBox from './SearchBox';
import ActivityMenu from './ActivityMenu'; // Import ActivityMenu
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

const MapComponent = () => {
  const mapElement = useRef();
  const popupElement = useRef(); // Ref for the popup DOM element
  const [mode, setMode] = useState('view'); // 'view', 'edit'
  const [popupData, setPopupData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for ActivityMenu
  
  const map = useMap(mapElement);
  const vectorSource = useMapLayers(map, mode);

  // Hooks
  useMapInteractions(map, vectorSource, mode);
  useMapClick(map, popupElement, setPopupData);
  const { contextMenuPosition, clickCoordinates, closeContextMenu } = useMapContextMenu(map);

  // Handlers
  const handleAddPointClick = () => {
    setIsModalOpen(true);
    closeContextMenu();
  };

  const handlePointSubmit = (pointData) => {
    if (vectorSource) {
      const feature = new Feature({
        geometry: new Point([pointData.longitude, pointData.latitude]),
        name: pointData.name,
        type: pointData.type,
      });
      vectorSource.addFeature(feature);
    }
    setIsModalOpen(false);
  };
  
  const handleSearch = (query) => {
    if (!vectorSource || !query) return;

    const features = vectorSource.getFeatures();
    const foundFeature = features.find(f => {
      const name = f.get('name');
      return name && name.toLowerCase().includes(query.toLowerCase());
    });

    if (foundFeature) {
      const coordinates = foundFeature.getGeometry().getCoordinates();
      map.getView().animate({
        center: coordinates,
        zoom: 15, // Zoom level to focus on the point
        duration: 1000,
      });
      
      // Simulate a click to open popup
      setPopupData({
          coordinates,
          name: foundFeature.get('name'),
          type: foundFeature.get('type'),
      });
    } else {
        alert('Point not found');
    }
  };

  const handleSelectActivity = (activityId) => {
      console.log("Selected activity:", activityId);
      // Future: Filter points by activityId
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
      
      {/* Pass handleMenuClick to SearchBox */}
      <SearchBox 
        onSearch={handleSearch} 
        onMenuClick={() => setIsMenuOpen(true)} 
        isMenuOpen={isMenuOpen}
      />

      {/* ActivityMenu Component */}
      <ActivityMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={handleSelectActivity} 
      />
      
      <Popup map={map} popupRef={popupElement} data={popupData} />
      
      <ContextMenu 
        position={contextMenuPosition} 
        onAddPoint={handleAddPointClick} 
        onClose={closeContextMenu}
      />
      
      <AddPointModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handlePointSubmit}
        initialCoordinates={clickCoordinates}
      />

      <MapControls mode={mode} setMode={setMode} />
    </div>
  );
};

export default MapComponent;
