import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProgress, getUserAchievements, getUserActivity } from '../services/gamificationService';
import { getUserById, uploadAvatar } from '../services/authService';
import './ProfilePage.css';

const API_BASE_URL = 'http://localhost:8000';

const ProfilePage = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Функция для получения иконки по типу достижения
  const getAchievementIcon = (achievementType) => {
    const iconMap = {
      first_step: '⭐',
      explorer: '🔍',
      activist: '🏆',
      expert: '❤️',
      legend: '💬',
      traveler: '📍',
    };
    return iconMap[achievementType] || '🏅';
  };

  // Функция для определения звания на основе уровня
  const getRankByLevel = (level) => {
    const rankTiers = [
      { min: 1, max: 10, rank: 'Новичок' },
      { min: 11, max: 20, rank: 'Исследователь' },
      { min: 21, max: 30, rank: 'Активист' },
      { min: 31, max: 40, rank: 'Эксперт' },
      { min: 41, max: 50, rank: 'Мастер' },
      { min: 51, max: 60, rank: 'Легенда' },
      { min: 61, max: 70, rank: 'Гуру' },
      { min: 71, max: 80, rank: 'Мудрец' },
      { min: 81, max: 90, rank: 'Властелин' },
      { min: 91, max: Infinity, rank: 'Легенда города' },
    ];

    const currentLevel = level || 1;
    const tier = rankTiers.find(t => currentLevel >= t.min && currentLevel <= t.max);
    return tier ? tier.rank : 'Новичок';
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Загружаем полные данные пользователя, прогресс, достижения и последние 5 активностей параллельно
        const [userDataResponse, progressData, achievementsData, activitiesData] = await Promise.all([
          getUserById(user.id),
          getUserProgress(user.id),
          getUserAchievements(user.id),
          getUserActivity(user.id, 5), // Загружаем последние 5 активностей
        ]);

        setUserData(userDataResponse);
        setProgress(progressData);

        // Логируем сырые данные для отладки
        console.log('Сырые данные достижений:', achievementsData);

        // Преобразуем достижения в нужный формат
        // Структура ответа может быть разной: либо с вложенным achievement, либо без
        const formattedAchievements = achievementsData.map((item) => {
          // Обрабатываем разные структуры ответа
          const achievement = item.achievement || item;
          const achievementType = achievement.achievement_type || item.achievement_type;
          const requirementValue = item.requirement_value || achievement.requirement_value || 1;
          
          // Определяем текущий прогресс: используем progress, если current_progress равен 0 или undefined
          // Судя по API, progress - это текущее значение прогресса
          let currentProgress = 0;
          if (item.progress !== undefined && item.progress !== null) {
            currentProgress = item.progress;
          } else if (item.current_progress !== undefined && item.current_progress !== null) {
            currentProgress = item.current_progress;
          }
          
          // Рассчитываем процент прогресса
          const progressPercentage =
            requirementValue > 0
              ? Math.min((currentProgress / requirementValue) * 100, 100)
              : 0;

          const formatted = {
            id: achievement.id || item.id,
            icon: getAchievementIcon(achievementType),
            title: achievement.name || 'Достижение',
            description: achievement.description || '',
            progress: Math.round(progressPercentage),
            completed: item.is_completed || false,
            xpReward: item.xp_reward || achievement.xp_reward || 0,
            currentProgress: currentProgress,
            requirementValue: requirementValue,
          };

          console.log('Обработанное достижение:', formatted);
          return formatted;
        });

        console.log('Все обработанные достижения:', formattedAchievements);
        setAchievements(formattedAchievements);
        
        // Сохраняем активности
        setActivities(activitiesData || []);
      } catch (err) {
        console.error('Ошибка загрузки данных профиля:', err);
        setError(err.message || 'Ошибка загрузки данных');
        // Используем заглушки при ошибке
        setProgress({
          current_level: 1,
          current_xp: 0,
        });
        setAchievements([]);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const profileData = {
    username: user?.username || user?.name || 'Пользователь',
    level: progress?.current_level || 1,
    points: progress?.current_xp || 0,
    city: 'Тула', // TODO: Получать с бекенда
    rank: getRankByLevel(progress?.current_level || 1),
    progressPercentage: progress?.progress_percentage || 0,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenMap = () => {
    navigate('/map');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (например, максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError('');
      const updatedUser = await uploadAvatar(user.id, file);
      setUserData(updatedUser);
      
      // Обновляем данные пользователя в контексте
      if (setUser) {
        setUser({
          ...user,
          avatar_url: updatedUser.avatar_url,
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err);
      setError(err.message || 'Ошибка загрузки аватара');
    } finally {
      setUploadingAvatar(false);
      // Очищаем input, чтобы можно было загрузить тот же файл снова
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Получаем URL аватара
  const getAvatarUrl = () => {
    if (!userData?.avatar_url) return null;
    // Если это полный URL, возвращаем как есть, иначе добавляем базовый URL
    if (userData.avatar_url.startsWith('http')) {
      return userData.avatar_url;
    }
    return `${API_BASE_URL}${userData.avatar_url.startsWith('/') ? '' : '/'}${userData.avatar_url}`;
  };

  // Функция для получения иконки по типу активности
  const getActivityIcon = (type) => {
    const iconMap = {
      point_created: '📍',
      mark_created: '⭐',
      achievement_unlocked: '🏆',
    };
    return iconMap[type] || '📝';
  };

  // Функция для форматирования текста активности
  const formatActivityText = (activity) => {
    const { type, title, description } = activity;
    
    // Если есть готовый title, используем его
    if (title) {
      return title;
    }
    
    // Форматируем в зависимости от типа
    switch (type) {
      case 'point_created':
        return `Создана точка: ${description || 'Новая точка'}`;
      case 'mark_created':
        return `Оставлен отзыв: ${description || 'Новый отзыв'}`;
      case 'achievement_unlocked':
        return `Получено достижение: ${description || 'Новое достижение'}`;
      default:
        return description || 'Активность';
    }
  };

  // Функция для форматирования времени активности
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Недавно';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'минуту' : diffMins < 5 ? 'минуты' : 'минут'} назад`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-card">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Загрузка...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Карточка заголовка */}
        <div className="profile-card header-card">
          <div className="profile-header-content">
            <div>
              <h1>Город Здоровья</h1>
              <p className="profile-city">{profileData.city}</p>
            </div>
            <button 
              onClick={handleOpenMap} 
              className="map-button"
            >
              Открыть карту
            </button>
          </div>
        </div>
        {/* Карточка профиля */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar-container">
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()} 
                  alt="Аватар" 
                  className="profile-avatar"
                  onError={(e) => {
                    // Если изображение не загрузилось, показываем иконку
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="profile-icon" 
                style={{ display: getAvatarUrl() ? 'none' : 'flex' }}
              >
                👤
              </div>
              <button
                className="avatar-upload-button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                title="Загрузить аватар"
              >
                {uploadingAvatar ? '⏳' : '📷'}
              </button>
            </div>
            <h2>{profileData.username}</h2>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div className="profile-info">
            <p className="profile-rank">{profileData.rank}</p>
            <p className="profile-stats">
              Уровень {profileData.level} | {profileData.points} XP
            </p>
            {progress && (
              <div className="level-progress-container">
                <div className="level-progress-bar">
                  <div 
                    className="level-progress-fill"
                    style={{ width: `${profileData.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="level-progress-text">
                  Прогресс до следующего уровня: {profileData.progressPercentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          <div className="profile-actions">
            <button 
              className="profile-button"
              onClick={() => navigate('/coupons')}
            >
              Бонусы и купоны
            </button>
            <button 
              className="profile-button"
              onClick={() => navigate('/admin')}
            >
              Админ-панель
            </button>
          </div>
        </div>

        {/* Карточка достижений */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Достижения</h2>
          </div>
          <p className="profile-card-subtitle">Получайте награды за активность</p>
          {error && (
            <div className="error-message" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}
          {achievements.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
              Достижения не найдены
            </p>
          ) : (
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h3 className="achievement-title">{achievement.title}</h3>
                  <p className="achievement-description">{achievement.description}</p>
                  {achievement.xpReward > 0 && (
                    <p className="achievement-xp">+{achievement.xpReward} XP</p>
                  )}
                  <div className="achievement-progress">
                    <div
                      className={`achievement-progress-bar ${
                        achievement.completed ? 'completed' : ''
                      }`}
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                  {achievement.requirementValue > 0 && (
                    <p className="achievement-progress-text">
                      {achievement.currentProgress} / {achievement.requirementValue}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Карточка последних активностей */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Последние активности</h2>
          </div>
          {activities.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
              Активности не найдены
            </p>
          ) : (
            <>
              <div className="activity-list">
                {activities.slice(0, 5).map((activity, index) => (
                  <div key={activity.timestamp || index} className="activity-item">
                    <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                    <div className="activity-content">
                      <p className="activity-action">{formatActivityText(activity)}</p>
                      <p className="activity-time">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                    {activity.xp_gained !== undefined && activity.xp_gained !== null && (
                      <div className="activity-points">+{activity.xp_gained} XP</div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/activity')} 
                className="view-all-activities-button"
              >
                Посмотреть все активности
              </button>
            </>
          )}
        </div>

        {/* Кнопка выхода */}
        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

