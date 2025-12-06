import React, { useEffect, useState } from 'react';
import { fetchPointTypes, savePoint } from '../../services/api';

const AddPointModal = ({ isOpen, onClose, onSubmit, initialCoordinates }) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPointTypes().then((data) => {
        setTypes(data);
        if (data.length > 0) setSelectedType(data[0].id);
      });
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const pointData = {
      name,
      type: selectedType,
      longitude: initialCoordinates[0],
      latitude: initialCoordinates[1],
    };

    await savePoint(pointData);
    
    setLoading(false);
    onSubmit(pointData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Add New Point</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Name:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label>Type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              style={styles.select}
            >
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.buttons}>
             <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
             <button type="submit" disabled={loading}>
               {loading ? 'Saving...' : 'Save'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    color: 'black',
  },
  field: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  input: {
    padding: '8px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '8px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  }
};

export default AddPointModal;

