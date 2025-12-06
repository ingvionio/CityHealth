import React, { useRef, useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapClick } from '../../hooks/useMapClick';
import { useMapContextMenu } from '../../hooks/useMapContextMenu';
import { MapControls } from './MapControls';
import Popup from './Popup';
import ContextMenu from './ContextMenu';
import AddPointModal from './AddPointModal';
import ReviewModal from './ReviewModal';
import ReviewsModal from './ReviewsModal';
import SearchBox from './SearchBox';
import ActivityMenu from './ActivityMenu'; // Import ActivityMenu
import { getAllPoints } from '../../services/pointsService';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';

const MapComponent = () => {
  const mapElement = useRef();
  const popupElement = useRef(); // Ref for the popup DOM element
  const [mode, setMode] = useState('view'); // 'view', 'edit'
  const [popupData, setPopupData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewPointId, setReviewPointId] = useState(null);
  const [reviewPointName, setReviewPointName] = useState('');
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviewsPointId, setReviewsPointId] = useState(null);
  const [reviewsPointName, setReviewsPointName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for ActivityMenu
  
  const map = useMap(mapElement);
  const vectorSource = useMapLayers(map, mode);

  // Hooks
  useMapInteractions(map, vectorSource, mode);
  useMapClick(map, popupElement, setPopupData);
  const { contextMenuPosition, clickCoordinates, closeContextMenu } = useMapContextMenu(map);

  // Функция загрузки точек с бекенда
  const loadPoints = async () => {
    if (!vectorSource) return;

    try {
      const points = await getAllPoints();
      
      // Очищаем все существующие точки перед загрузкой новых
      vectorSource.clear();
      
      // Добавляем точки с бекенда
      points.forEach((point) => {
        // Преобразуем координаты из градусов (EPSG:4326) в метры (EPSG:3857)
        const coordinates = fromLonLat([point.longitude, point.latitude]);
        
        // Получаем оценку точки напрямую из point.mark
        // Бекенд возвращает mark как число (может быть 0, 3.5, 4.5 и т.д.)
        const mark = point.mark !== undefined ? Number(point.mark) : null;
        
        // Логируем для отладки первые несколько точек
        if (points.indexOf(point) < 3) {
          console.log('Точка:', point.name, 'point.mark (raw):', point.mark, 'mark (number):', mark, 'type:', typeof point.mark);
        }
        
        const feature = new Feature({
          geometry: new Point(coordinates),
          name: point.name,
          id: point.id,
          industry_id: point.industry_id,
          sub_industry_id: point.sub_industry_id,
          creator_id: point.creator_id,
        });
        
        // Устанавливаем mark ВСЕГДА, даже если он 0 или null
        // Это важно для правильной работы стилей
        feature.set('mark', mark !== null && mark !== undefined && !isNaN(mark) ? mark : null);
        
        // Проверяем, что mark установлен правильно
        const checkMark = feature.get('mark');
        if (points.indexOf(point) < 5) {
          console.log('Точка загружена:', {
            name: point.name,
            'point.mark (raw)': point.mark,
            'mark (processed)': mark,
            'feature.get("mark")': checkMark,
            'mark type': typeof checkMark
          });
        }
        
        vectorSource.addFeature(feature);
      });
      
      // Принудительно обновляем стили после загрузки точек
      if (map) {
        vectorSource.changed();
        // Обновляем все слои карты
        map.getLayers().forEach(layer => {
          if (layer instanceof VectorLayer) {
            layer.changed();
          }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки точек:', error);
    }
  };

  // Загружаем точки с бекенда при монтировании компонента
  useEffect(() => {
    loadPoints();
  }, [vectorSource]);

  // Handlers
  const handleAddPointClick = () => {
    setIsModalOpen(true);
    closeContextMenu();
  };

  const handlePointSubmit = (pointData) => {
    if (vectorSource) {
      // pointData - это объект, возвращенный с бекенда после создания
      // Преобразуем координаты из градусов (EPSG:4326) в метры (EPSG:3857)
      const coordinates = fromLonLat([pointData.longitude, pointData.latitude]);
      
      const feature = new Feature({
        geometry: new Point(coordinates),
        name: pointData.name,
        id: pointData.id,
        industry_id: pointData.industry_id,
        sub_industry_id: pointData.sub_industry_id,
        mark: pointData.mark || pointData.rating || 0, // Оценка точки (может быть mark или rating)
        creator_id: pointData.creator_id,
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
          id: foundFeature.get('id'),
          industry_id: foundFeature.get('industry_id'),
          sub_industry_id: foundFeature.get('sub_industry_id'),
          mark: foundFeature.get('mark') || 0,
      });
    } else {
        alert('Point not found');
    }
  };

  const handleSelectActivity = (activityId) => {
      console.log("Selected activity:", activityId);
      // Future: Filter points by activityId
  };

  const handleReviewClick = (pointId, pointName) => {
    setReviewPointId(pointId);
    setReviewPointName(pointName);
    setIsReviewModalOpen(true);
  };

  const handleViewReviewsClick = (pointId, pointName) => {
    setReviewsPointId(pointId);
    setReviewsPointName(pointName);
    setIsReviewsModalOpen(true);
  };

  const handleReviewSubmit = async (answers) => {
    console.log('Отзыв отправлен для точки:', reviewPointId, answers);
    // Перезагружаем точки после отправки отзыва, чтобы обновить оценки
    await loadPoints();
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
      
      <Popup 
        map={map} 
        popupRef={popupElement} 
        data={popupData}
        onReviewClick={handleReviewClick}
        onViewReviewsClick={handleViewReviewsClick}
      />
      
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

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        pointId={reviewPointId}
        pointName={reviewPointName}
        onSubmit={handleReviewSubmit}
      />

      <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        pointId={reviewsPointId}
        pointName={reviewsPointName}
      />

      <MapControls mode={mode} setMode={setMode} />
    </div>
  );
};

export default MapComponent;
