import React from 'react';
import './HeatmapToggle.css';

const HeatmapToggle = ({ isActive, onToggle }) => {
  return (
    <button
      className={`heatmap-toggle ${isActive ? 'active' : ''}`}
      onClick={onToggle}
      title={isActive ? 'Скрыть тепловую карту' : 'Показать тепловую карту'}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heat/Fire icon */}
        <path
          d="M12 23C8.5 23 4 19.5 4 14C4 9.5 7 6.5 8 5C8 7.5 9.5 9.5 12 9.5C14.5 9.5 16 7.5 16 5C18 7.5 20 9.5 20 14C20 19.5 15.5 23 12 23Z"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 23C13.5 23 15 21.5 15 19C15 16.5 13.5 15 12 13C10.5 15 9 16.5 9 19C9 21.5 10.5 23 12 23Z"
          fill={isActive ? '#fff' : 'none'}
          stroke={isActive ? '#fff' : 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="heatmap-toggle-label">
        {isActive ? 'Тепловая карта' : 'Тепловая карта'}
      </span>
    </button>
  );
};

export default HeatmapToggle;

