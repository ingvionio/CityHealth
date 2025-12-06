import React, { useRef, useState, useEffect } from 'react';
import { useMap } from '../../hooks/useMap';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapClick } from '../../hooks/useMapClick';
import { useMapContextMenu } from '../../hooks/useMapContextMenu';
import { useHeatmapLayer } from '../../hooks/useHeatmapLayer';
import { getPointColor } from '../../utils/mapStyles';
import { MapControls } from './MapControls';
import Popup from './Popup';
import ContextMenu from './ContextMenu';
import AddPointModal from './AddPointModal';
import ReviewModal from './ReviewModal';
import ReviewsModal from './ReviewsModal';
import SearchBox from './SearchBox';
import ActivityMenu from './ActivityMenu'; // Import ActivityMenu
import MapLayerToggles from './MapLayerToggles';
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
  const [pointsData, setPointsData] = useState([]); // Store points data for search autocomplete
  
  const map = useMap(mapElement);
  const { vectorSource, arePointsVisible, togglePointsVisibility } = useMapLayers(map, mode);
  
  // Heatmap layer hook
  const { isHeatmapVisible, toggleHeatmap } = useHeatmapLayer(map, vectorSource);

  // Hooks
  useMapInteractions(map, vectorSource, mode);
  useMapClick(map, popupElement, setPopupData);
  const { contextMenuPosition, clickCoordinates, closeContextMenu } = useMapContextMenu(map);

  // Функция загрузки точек с бекенда
  const loadPoints = async () => {
    if (!vectorSource) return;

    try {
      const points = await getAllPoints();
      
      // Store points data for search autocomplete
      setPointsData(points);
      
      // Очищаем все существующие точки перед загрузкой новых
      vectorSource.clear();
      
      // Добавляем точки с бекенда
      points.forEach((point) => {
        // Преобразуем координаты из градусов (EPSG:4326) в метры (EPSG:3857)
        const coordinates = fromLonLat([point.longitude, point.latitude]);
        
        // Получаем оценку точки напрямую из point.mark
        // Бекенд возвращает mark как число (может быть 0, 3.5, 4.5 и т.д.)
        const mark = point.mark !== undefined ? Number(point.mark) : null;
        const color = getPointColor(mark);
        
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
        feature.set('color', color);
        
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

  // Обновление одной точки после оценки (без полной перерисовки)
  const refreshPointMark = async (pointId) => {
    if (!vectorSource || !pointId) return;
    try {
      const points = await getAllPoints();
      const updatedPoint = points.find((p) => p.id === pointId);
      if (!updatedPoint) return;

      // Обновляем данные для поиска
      setPointsData((prev) => {
        if (!prev || prev.length === 0) return points;
        return prev.map((p) => (p.id === pointId ? updatedPoint : p));
      });

      // Обновляем feature в vectorSource
      const features = vectorSource.getFeatures();
      const targetFeature = features.find((f) => f.get('id') === pointId);
      if (targetFeature) {
        const newMark = updatedPoint.mark !== undefined ? Number(updatedPoint.mark) : null;
        targetFeature.set('mark', !Number.isNaN(newMark) ? newMark : null);
        targetFeature.set('color', getPointColor(!Number.isNaN(newMark) ? newMark : null));
        vectorSource.changed();
        // Обновим слои карты, чтобы стиль перекрасился
        if (map) {
          map.getLayers().forEach((layer) => {
            if (layer instanceof VectorLayer) {
              layer.changed();
            }
          });
        }
      }
    } catch (error) {
      console.error('Ошибка обновления точки после оценки:', error);
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
      
      const mark = pointData.mark || pointData.rating || 0;
      const feature = new Feature({
        geometry: new Point(coordinates),
        name: pointData.name,
        id: pointData.id,
        industry_id: pointData.industry_id,
        sub_industry_id: pointData.sub_industry_id,
        mark,
        creator_id: pointData.creator_id,
      });
      feature.set('color', getPointColor(mark));
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
    // Обновляем только одну точку (перекрасить маркер) вместо полной перезагрузки
    await refreshPointMark(reviewPointId);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
      
      {/* Pass handleMenuClick to SearchBox */}
      <SearchBox 
        onSearch={handleSearch} 
        onMenuClick={() => setIsMenuOpen(true)} 
        isMenuOpen={isMenuOpen}
        points={pointsData}
      />

      {/* ActivityMenu Component */}
      <ActivityMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={handleSelectActivity} 
      />
      
      {/* Map Layer Toggle Buttons */}
      <MapLayerToggles 
        isHeatmapActive={isHeatmapVisible} 
        onHeatmapToggle={toggleHeatmap}
        arePointsVisible={arePointsVisible}
        onPointsToggle={togglePointsVisibility}
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
