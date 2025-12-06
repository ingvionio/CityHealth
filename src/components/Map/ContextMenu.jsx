import React from 'react';

const ContextMenu = ({ position, onAddPoint, onClose }) => {
  if (!position) return null;

  const style = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    zIndex: 200,
    backgroundColor: 'white',
    padding: '8px 12px',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    color: '#333',
    fontSize: '14px',
    fontWeight: '500',
  };

  return (
    <div style={style} onClick={onAddPoint}>
      + Add point
    </div>
  );
};

export default ContextMenu;

