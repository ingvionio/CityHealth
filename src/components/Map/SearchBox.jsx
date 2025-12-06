import React, { useState } from 'react';
import './SearchBox.css'; // Import the CSS file

const SearchBox = ({ onSearch, onMenuClick, isMenuOpen }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form 
      className={`search-box ${isMenuOpen ? 'menu-open' : ''}`} // Use a class for styling
      onSubmit={handleSearch}
    >
      {/* Menu Trigger Button */}
      <button 
        type="button" 
        className="menu-button"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <input
        type="text"
        placeholder="Search points..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button 
        type="submit" 
        className="search-button"
      >
        🔍
      </button>
    </form>
  );
};

export default SearchBox;
