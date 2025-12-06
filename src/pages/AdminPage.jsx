import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCriteriaByIndustry, 
  createCriterion, 
  deleteCriterion,
  createIndustry,
  deleteIndustry,
  createSubIndustry,
  deleteSubIndustry,
  deletePoint
} from '../services/adminService';
import { getIndustries, getSubIndustries, getAllPoints } from '../services/pointsService';
import './AdminPage.css';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('criteria'); // 'criteria', 'industries', 'sub-industries', 'points'
  
  // Criteria state
  const [criteria, setCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [criteriaError, setCriteriaError] = useState('');
  const [newCriterionText, setNewCriterionText] = useState('');
  const [selectedIndustryForCriteria, setSelectedIndustryForCriteria] = useState('');
  
  // Industries state
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [industriesError, setIndustriesError] = useState('');
  const [newIndustryName, setNewIndustryName] = useState('');
  
  // Sub-industries state
  const [subIndustries, setSubIndustries] = useState([]);
  const [subIndustriesLoading, setSubIndustriesLoading] = useState(false);
  const [subIndustriesError, setSubIndustriesError] = useState('');
  const [newSubIndustryName, setNewSubIndustryName] = useState('');
  const [selectedIndustryForSub, setSelectedIndustryForSub] = useState('');
  
  // Points state
  const [points, setPoints] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState('');

  // Загрузка критериев
  const loadCriteria = async () => {
    try {
      setCriteriaLoading(true);
      setCriteriaError('');
      if (selectedIndustryForCriteria) {
        const data = await getCriteriaByIndustry(parseInt(selectedIndustryForCriteria));
        setCriteria(data);
      } else {
        setCriteria([]);
      }
    } catch (err) {
      setCriteriaError(err.message || 'Ошибка загрузки критериев');
    } finally {
      setCriteriaLoading(false);
    }
  };

  // Загрузка отраслей
  const loadIndustries = async () => {
    try {
      setIndustriesLoading(true);
      setIndustriesError('');
      const data = await getIndustries();
      setIndustries(data);
    } catch (err) {
      setIndustriesError(err.message || 'Ошибка загрузки отраслей');
    } finally {
      setIndustriesLoading(false);
    }
  };

  // Загрузка подотраслей
  const loadSubIndustries = async () => {
    try {
      setSubIndustriesLoading(true);
      setSubIndustriesError('');
      if (selectedIndustryForSub) {
        const data = await getSubIndustries(parseInt(selectedIndustryForSub));
        setSubIndustries(data);
      } else {
        setSubIndustries([]);
      }
    } catch (err) {
      setSubIndustriesError(err.message || 'Ошибка загрузки подотраслей');
    } finally {
      setSubIndustriesLoading(false);
    }
  };

  // Загрузка точек
  const loadPoints = async () => {
    try {
      setPointsLoading(true);
      setPointsError('');
      const data = await getAllPoints();
      setPoints(data);
    } catch (err) {
      setPointsError(err.message || 'Ошибка загрузки точек');
    } finally {
      setPointsLoading(false);
    }
  };

  // Загружаем данные при смене таба
  useEffect(() => {
    if (activeTab === 'criteria') {
      loadIndustries(); // Загружаем отрасли для выбора
      if (selectedIndustryForCriteria) {
        loadCriteria();
      }
    } else if (activeTab === 'industries') {
      loadIndustries();
    } else if (activeTab === 'sub-industries') {
      loadIndustries(); // Загружаем отрасли для выбора
      if (selectedIndustryForSub) {
        loadSubIndustries();
      }
    } else if (activeTab === 'points') {
      loadPoints();
    }
  }, [activeTab, selectedIndustryForSub, selectedIndustryForCriteria]);

  // Создание критерия
  const handleCreateCriterion = async (e) => {
    e.preventDefault();
    if (!newCriterionText.trim() || !selectedIndustryForCriteria) {
      setCriteriaError('Выберите отрасль и введите текст критерия');
      return;
    }

    try {
      setCriteriaError('');
      await createCriterion({ 
        text: newCriterionText.trim(),
        industry_id: parseInt(selectedIndustryForCriteria)
      });
      setNewCriterionText('');
      await loadCriteria();
    } catch (err) {
      setCriteriaError(err.message || 'Ошибка создания критерия');
    }
  };

  // Удаление критерия
  const handleDeleteCriterion = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот критерий?')) {
      return;
    }

    try {
      setCriteriaError('');
      await deleteCriterion(id);
      await loadCriteria();
    } catch (err) {
      setCriteriaError(err.message || 'Ошибка удаления критерия');
    }
  };

  // Создание отрасли
  const handleCreateIndustry = async (e) => {
    e.preventDefault();
    if (!newIndustryName.trim()) {
      setIndustriesError('Введите название отрасли');
      return;
    }

    try {
      setIndustriesError('');
      await createIndustry({ name: newIndustryName.trim() });
      setNewIndustryName('');
      await loadIndustries();
    } catch (err) {
      setIndustriesError(err.message || 'Ошибка создания отрасли');
    }
  };

  // Удаление отрасли
  const handleDeleteIndustry = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту отрасль? Все подотрасли также будут удалены.')) {
      return;
    }

    try {
      setIndustriesError('');
      await deleteIndustry(id);
      await loadIndustries();
      if (activeTab === 'sub-industries') {
        setSelectedIndustryForSub('');
        setSubIndustries([]);
      }
    } catch (err) {
      setIndustriesError(err.message || 'Ошибка удаления отрасли');
    }
  };

  // Создание подотрасли
  const handleCreateSubIndustry = async (e) => {
    e.preventDefault();
    if (!newSubIndustryName.trim() || !selectedIndustryForSub) {
      setSubIndustriesError('Выберите отрасль и введите название подотрасли');
      return;
    }

    try {
      setSubIndustriesError('');
      await createSubIndustry({ 
        name: newSubIndustryName.trim(),
        industry_id: parseInt(selectedIndustryForSub)
      });
      setNewSubIndustryName('');
      await loadSubIndustries();
    } catch (err) {
      setSubIndustriesError(err.message || 'Ошибка создания подотрасли');
    }
  };

  // Удаление подотрасли
  const handleDeleteSubIndustry = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту подотрасль?')) {
      return;
    }

    try {
      setSubIndustriesError('');
      await deleteSubIndustry(id);
      await loadSubIndustries();
    } catch (err) {
      setSubIndustriesError(err.message || 'Ошибка удаления подотрасли');
    }
  };

  // Удаление точки
  const handleDeletePoint = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту точку?')) {
      return;
    }

    try {
      setPointsError('');
      await deletePoint(id);
      await loadPoints();
    } catch (err) {
      setPointsError(err.message || 'Ошибка удаления точки');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Заголовок */}
        <div className="admin-header">
          <h1>Админ-панель</h1>
          <button 
            onClick={() => navigate('/profile')} 
            className="admin-back-button"
          >
            ← Назад к профилю
          </button>
        </div>

        {/* Табы */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'criteria' ? 'active' : ''}`}
            onClick={() => setActiveTab('criteria')}
          >
            Критерии
          </button>
          <button 
            className={`admin-tab ${activeTab === 'industries' ? 'active' : ''}`}
            onClick={() => setActiveTab('industries')}
          >
            Отрасли
          </button>
          <button 
            className={`admin-tab ${activeTab === 'sub-industries' ? 'active' : ''}`}
            onClick={() => setActiveTab('sub-industries')}
          >
            Подотрасли
          </button>
          <button 
            className={`admin-tab ${activeTab === 'points' ? 'active' : ''}`}
            onClick={() => setActiveTab('points')}
          >
            Точки
          </button>
        </div>

        {/* Контент табов */}
        <div className="admin-tab-content">
          {/* Критерии */}
          {activeTab === 'criteria' && (
            <div className="admin-section">
              <h2>Управление критериями</h2>
              
              {/* Выбор отрасли */}
              <div className="admin-form-group">
                <label>Выберите отрасль</label>
                <select
                  value={selectedIndustryForCriteria}
                  onChange={(e) => {
                    setSelectedIndustryForCriteria(e.target.value);
                    setCriteria([]);
                  }}
                  className="admin-select"
                >
                  <option value="">-- Выберите отрасль --</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Форма создания */}
              {selectedIndustryForCriteria && (
                <form onSubmit={handleCreateCriterion} className="admin-form">
                  <div className="admin-form-group">
                    <label>Текст критерия</label>
                    <input
                      type="text"
                      value={newCriterionText}
                      onChange={(e) => setNewCriterionText(e.target.value)}
                      placeholder="Введите текст критерия"
                      required
                    />
                  </div>
                  <button type="submit" className="admin-button admin-button-primary">
                    Создать критерий
                  </button>
                </form>
              )}

              {criteriaError && (
                <div className="admin-error">{criteriaError}</div>
              )}

              {/* Список критериев */}
              <div className="admin-list">
                {criteriaLoading ? (
                  <p>Загрузка...</p>
                ) : !selectedIndustryForCriteria ? (
                  <p className="admin-empty">Выберите отрасль для просмотра критериев</p>
                ) : criteria.length === 0 ? (
                  <p className="admin-empty">Критерии не найдены</p>
                ) : (
                  criteria.map((criterion) => (
                    <div key={criterion.id} className="admin-list-item">
                      <span>{criterion.text || criterion.question || 'Без названия'}</span>
                      <button
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        className="admin-button admin-button-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Отрасли */}
          {activeTab === 'industries' && (
            <div className="admin-section">
              <h2>Управление отраслями</h2>
              
              {/* Форма создания */}
              <form onSubmit={handleCreateIndustry} className="admin-form">
                <div className="admin-form-group">
                  <label>Название отрасли</label>
                  <input
                    type="text"
                    value={newIndustryName}
                    onChange={(e) => setNewIndustryName(e.target.value)}
                    placeholder="Введите название отрасли"
                    required
                  />
                </div>
                <button type="submit" className="admin-button admin-button-primary">
                  Создать отрасль
                </button>
              </form>

              {industriesError && (
                <div className="admin-error">{industriesError}</div>
              )}

              {/* Список отраслей */}
              <div className="admin-list">
                {industriesLoading ? (
                  <p>Загрузка...</p>
                ) : industries.length === 0 ? (
                  <p className="admin-empty">Отрасли не найдены</p>
                ) : (
                  industries.map((industry) => (
                    <div key={industry.id} className="admin-list-item">
                      <span>{industry.name || 'Без названия'}</span>
                      <button
                        onClick={() => handleDeleteIndustry(industry.id)}
                        className="admin-button admin-button-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Подотрасли */}
          {activeTab === 'sub-industries' && (
            <div className="admin-section">
              <h2>Управление подотраслями</h2>
              
              {/* Выбор отрасли */}
              <div className="admin-form-group">
                <label>Выберите отрасль</label>
                <select
                  value={selectedIndustryForSub}
                  onChange={(e) => {
                    setSelectedIndustryForSub(e.target.value);
                    setSubIndustries([]);
                  }}
                  className="admin-select"
                >
                  <option value="">-- Выберите отрасль --</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Форма создания */}
              {selectedIndustryForSub && (
                <form onSubmit={handleCreateSubIndustry} className="admin-form">
                  <div className="admin-form-group">
                    <label>Название подотрасли</label>
                    <input
                      type="text"
                      value={newSubIndustryName}
                      onChange={(e) => setNewSubIndustryName(e.target.value)}
                      placeholder="Введите название подотрасли"
                      required
                    />
                  </div>
                  <button type="submit" className="admin-button admin-button-primary">
                    Создать подотрасль
                  </button>
                </form>
              )}

              {subIndustriesError && (
                <div className="admin-error">{subIndustriesError}</div>
              )}

              {/* Список подотраслей */}
              <div className="admin-list">
                {subIndustriesLoading ? (
                  <p>Загрузка...</p>
                ) : !selectedIndustryForSub ? (
                  <p className="admin-empty">Выберите отрасль для просмотра подотраслей</p>
                ) : subIndustries.length === 0 ? (
                  <p className="admin-empty">Подотрасли не найдены</p>
                ) : (
                  subIndustries.map((subIndustry) => (
                    <div key={subIndustry.id} className="admin-list-item">
                      <span>{subIndustry.name || 'Без названия'}</span>
                      <button
                        onClick={() => handleDeleteSubIndustry(subIndustry.id)}
                        className="admin-button admin-button-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Точки */}
          {activeTab === 'points' && (
            <div className="admin-section">
              <h2>Управление точками</h2>

              {pointsError && (
                <div className="admin-error">{pointsError}</div>
              )}

              {/* Список точек */}
              <div className="admin-list">
                {pointsLoading ? (
                  <p>Загрузка...</p>
                ) : points.length === 0 ? (
                  <p className="admin-empty">Точки не найдены</p>
                ) : (
                  points.map((point) => (
                    <div key={point.id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <span className="admin-item-name">{point.name || 'Без названия'}</span>
                        <span className="admin-item-meta">
                          Координаты: {point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)}
                        </span>
                        {point.mark && (
                          <span className="admin-item-meta">Оценка: {point.mark}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePoint(point.id)}
                        className="admin-button admin-button-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

