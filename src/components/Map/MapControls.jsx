import React from 'react';

export const MapControls = ({ mode, setMode }) => {
  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100, background: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 0 5px rgba(0,0,0,0.3)' }}>
      <button 
        onClick={() => setMode('view')} 
        style={{ fontWeight: mode === 'view' ? 'bold' : 'normal', marginRight: '5px' }}
      >
        View
      </button>
      <button 
        onClick={() => setMode('edit')} 
        style={{ fontWeight: mode === 'edit' ? 'bold' : 'normal' }}
      >
        Edit Points
      </button>
    </div>
  );
};
