import React, { useEffect, useState } from 'react';
import { getPointCriteria, createMark } from '../../services/pointsService';
import { useAuth } from '../../contexts/AuthContext';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, pointId, pointName, onSubmit }) => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState([]);
  const [answers, setAnswers] = useState({}); // { criterionId: { rating: 1-5, weight: 1-5 } }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && pointId) {
      loadCriteria();
      setAnswers({});
      setError('');
    }
  }, [isOpen, pointId]);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const data = await getPointCriteria(pointId);
      setCriteria(data);
      
      // Инициализируем ответы пустыми значениями
      const initialAnswers = {};
      data.forEach((criterion) => {
        initialAnswers[criterion.id] = {
          rating: '',
          weight: '',
        };
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Ошибка загрузки критериев:', err);
      setError(err.message || 'Ошибка загрузки вопросов');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (criterionId, value) => {
    setAnswers({
      ...answers,
      [criterionId]: {
        ...answers[criterionId],
        rating: value ? parseInt(value) : '',
      },
    });
  };

  const handleWeightChange = (criterionId, value) => {
    setAnswers({
      ...answers,
      [criterionId]: {
        ...answers[criterionId],
        weight: value ? parseInt(value) : '',
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем, что все вопросы отвечены
    const unanswered = criteria.filter(c => {
      const answer = answers[c.id];
      return !answer || !answer.rating || !answer.weight;
    });
    
    if (unanswered.length > 0) {
      setError('Пожалуйста, ответьте на все вопросы');
      return;
    }

    if (!user?.id) {
      setError('Пользователь не авторизован');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Формируем данные для отправки на бекенд
      const questionIds = [];
      const answerValues = [];
      const weights = [];

      criteria.forEach((criterion) => {
        const answer = answers[criterion.id];
        questionIds.push(criterion.id);
        answerValues.push(answer.rating);
        weights.push(answer.weight);
      });

      const markData = {
        point_id: parseInt(pointId),
        user_id: parseInt(user.id),
        question_ids: questionIds,
        answers: answerValues,
        weights: weights,
      };

      console.log('Отправка оценки:', markData);
      await createMark(markData);
      console.log('Оценка успешно отправлена');

      if (onSubmit) {
        onSubmit(answers);
      }
      onClose();
    } catch (err) {
      console.error('Ошибка отправки оценки:', err);
      setError(err.message || 'Ошибка отправки оценки');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Оценить точку</h2>
          <button className="review-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="review-modal-body">
          <p className="review-point-name">Точка: <strong>{pointName}</strong></p>
          
          {error && <div className="review-error">{error}</div>}
          
          {loading ? (
            <div className="review-loading">Загрузка вопросов...</div>
          ) : criteria.length === 0 ? (
            <div className="review-no-questions">Нет вопросов для этой точки</div>
          ) : (
            <form onSubmit={handleSubmit} className="review-form">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="review-question">
                  <label className="review-question-label">
                    {criterion.text}
                  </label>
                  <div className="review-ratings">
                    <div className="review-rating-group">
                      <label className="review-rating-label">
                        Насколько вам нравится (1-5):
                      </label>
                      <select
                        className="review-rating-select"
                        value={answers[criterion.id]?.rating || ''}
                        onChange={(e) => handleRatingChange(criterion.id, e.target.value)}
                        required
                        disabled={submitting}
                      >
                        <option value="">Выберите оценку</option>
                        <option value="1">1 - Не нравится</option>
                        <option value="2">2 - Скорее не нравится</option>
                        <option value="3">3 - Нейтрально</option>
                        <option value="4">4 - Скорее нравится</option>
                        <option value="5">5 - Очень нравится</option>
                      </select>
                    </div>
                    <div className="review-rating-group">
                      <label className="review-rating-label">
                        Насколько это важно для вас (1-5):
                      </label>
                      <select
                        className="review-rating-select"
                        value={answers[criterion.id]?.weight || ''}
                        onChange={(e) => handleWeightChange(criterion.id, e.target.value)}
                        required
                        disabled={submitting}
                      >
                        <option value="">Выберите важность</option>
                        <option value="1">1 - Не важно</option>
                        <option value="2">2 - Мало важно</option>
                        <option value="3">3 - Средне важно</option>
                        <option value="4">4 - Важно</option>
                        <option value="5">5 - Очень важно</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="review-modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="review-button review-button-cancel"
                  disabled={submitting}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="review-button review-button-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Отправка...' : 'Отправить оценку'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

