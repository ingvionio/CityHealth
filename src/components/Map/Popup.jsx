import React, { useRef, useEffect } from 'react';
import Overlay from 'ol/Overlay';
import { toLonLat } from 'ol/proj';
import './Popup.css';

const Popup = ({ map, popupRef, data }) => {
  // Ref to store the overlay instance so we don't recreate it unnecessarily
  const overlayInstanceRef = useRef(null);
  const contentRef = useRef(null);
  const closerRef = useRef(null);

  // Initialize the Overlay ONCE when map is available
  useEffect(() => {
    if (!map || !popupRef.current) return;
    
    // If overlay already exists, don't recreate it
    if (overlayInstanceRef.current) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      // Important: OpenLayers moves the element in the DOM. 
      // stopEvent: false allows clicks inside popup to propagate if needed, usually true is default.
    });
    
    map.addOverlay(overlay);
    overlayInstanceRef.current = overlay;

    // Cleanup: Remove overlay when component unmounts
    return () => {
      if (map && overlay) {
        map.removeOverlay(overlay);
        overlayInstanceRef.current = null;
      }
    };
  }, [map]); // Remove popupRef from deps to avoid re-running if ref object identity changes (it shouldn't)

  // Effect to update overlay position when data changes
  useEffect(() => {
      if (overlayInstanceRef.current && data && data.coordinates) {
          overlayInstanceRef.current.setPosition(data.coordinates);
      } else if (overlayInstanceRef.current && !data) {
          overlayInstanceRef.current.setPosition(undefined);
      }
  }, [data]);

  const closePopup = (e) => {
     e.preventDefault(); // Prevent href="#" navigation
     if (overlayInstanceRef.current) {
         overlayInstanceRef.current.setPosition(undefined);
         // Notify parent that popup is closed? 
         // Ideally we should setPopupData(null) in parent, but we can visually close it here.
         // Since data prop controls visibility via CSS, we probably want to callback to clear data.
     }
  };

  // Format coordinates to display (Lon/Lat)
  const formattedCoordinates = data && data.coordinates
    ? toLonLat(data.coordinates).map((coord) => coord.toFixed(4)).join(', ')
    : '';

  // OpenLayers moves this DOM element into its own container.
  // We must ensure React doesn't lose track of it or try to remove it from its original parent 
  // in a way that conflicts with OpenLayers.
  // React Portal is often a cleaner way to handle this, but simple ref attachment works 
  // if we are careful about unmounting.
  
  return (
    <div ref={popupRef} className="ol-popup" style={{ display: data ? 'block' : 'none' }}>
      <a href="#" className="ol-popup-closer" ref={closerRef} onClick={closePopup}></a>
      {data && (
        <div className="popup-content" ref={contentRef}>
            <h3>Everything is OK</h3>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Type:</strong> {data.type}</p>
            <p><small>Coords: {formattedCoordinates}</small></p>
        </div>
      )}
    </div>
  );
};

export default Popup;
