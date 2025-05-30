// src/components/UpdatePasswordForm.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/UpdatePasswordForm.css';

export default function UpdatePasswordForm({ item, onUpdate, onClose }) {
  const [formData, setFormData] = useState({
    domain: item.domain,
    username: item.username,
    password: item.password,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ _id: item._id, ...formData });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="update-password-form">
        <h3>Update Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="domain">Domain:</label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Update
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

UpdatePasswordForm.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};