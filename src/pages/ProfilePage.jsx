import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProgress, getUserAchievements } from '../services/gamificationService';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');

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

        // Загружаем прогресс и достижения параллельно
        const [progressData, achievementsData] = await Promise.all([
          getUserProgress(user.id),
          getUserAchievements(user.id),
        ]);

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
      } catch (err) {
        console.error('Ошибка загрузки данных профиля:', err);
        setError(err.message || 'Ошибка загрузки данных');
        // Используем заглушки при ошибке
        setProgress({
          current_level: 1,
          current_xp: 0,
        });
        setAchievements([]);
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

  // ЗАГЛУШКА: История активности (будет получаться с бекенда)
  const activityHistory = [
    {
      id: 1,
      icon: '⭐',
      action: 'Оценен объект "Парк Культуры и Отдыха"',
      timeAgo: '2 дня назад',
      points: 10,
    },
    {
      id: 2,
      icon: '💬',
      action: 'Оставлен отзыв о "Кафе"',
      timeAgo: '1 день назад',
      points: 5,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenMap = () => {
    navigate('/map');
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
            <div className="profile-icon">👤</div>
            <h2>{profileData.username}</h2>
          </div>
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
            <button className="profile-button">Редактировать</button>
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

        {/* Карточка истории активности */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>История активности</h2>
          </div>
          <div className="activity-list">
            {activityHistory.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <p className="activity-action">{activity.action}</p>
                  <p className="activity-time">{activity.timeAgo}</p>
                </div>
                <div className="activity-points">+{activity.points}</div>
              </div>
            ))}
          </div>
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

