import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MapComponent from '../components/Map/MapComponent';
import './MapPage.css';

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="map-page">
      <button 
        className="map-profile-button"
        onClick={handleProfileClick}
        title="Перейти в профиль"
      >
        <span className="map-profile-icon">👤</span>
        {user?.name || user?.username || 'Профиль'}
      </button>
      <MapComponent />
    </div>
  );
};

export default MapPage;

