import { useState } from 'react';
import { FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import type { DeliveryAddress } from './types/checkout.types';

interface DeliveryAddressSectionProps {
  address: DeliveryAddress | null;
  onAddressChange: (address: DeliveryAddress) => void;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export const DeliveryAddressSection = ({
  address,
  onAddressChange,
  error,
  hasError,
  disabled = false,
}: DeliveryAddressSectionProps) => {
  const [isEditing, setIsEditing] = useState(!address);
  const [editData, setEditData] = useState<DeliveryAddress>(
    address || {
      fullName: '',
      phone: '',
      streetAddress: '',
      city: '',
      province: '',
      postalCode: '',
    }
  );

  const handleEdit = () => {
    if (address) {
      setEditData(address);
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    // Basic validation
    if (editData.fullName && editData.phone && editData.streetAddress && editData.city) {
      onAddressChange(editData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (address) {
      setEditData(address);
      setIsEditing(false);
    }
  };

  const handleInputChange = (field: keyof DeliveryAddress, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`address-section ${hasError ? 'has-error' : ''}`}>
      <div className="section-header">
        <h2 className="section-title">Delivery address</h2>
        {address && !isEditing && (
          <button 
            className="edit-button"
            onClick={handleEdit}
            disabled={disabled}
          >
            <FiEdit3 size={14} />
            Edit
          </button>
        )}
      </div>

      {!isEditing && address ? (
        // Display mode
        <div className="address-display">
          <div className="address-name">{address.fullName}</div>
          <div className="address-details">
            <div>{address.phone}</div>
            <div>{address.streetAddress}</div>
            <div>{address.city}</div>
          </div>
        </div>
      ) : (
        // Edit mode
        <div className="address-form">
          <div className="form-grid">
            <div className="form-group span-2">
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                value={editData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                disabled={disabled}
                className={!editData.fullName ? 'error' : ''}
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                value={editData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+92 300 1234567"
                disabled={disabled}
                className={!editData.phone ? 'error' : ''}
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="streetAddress">Street Address *</label>
              <input
                id="streetAddress"
                type="text"
                value={editData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="House number, street name"
                disabled={disabled}
                className={!editData.streetAddress ? 'error' : ''}
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                type="text"
                value={editData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                disabled={disabled}
                className={!editData.city ? 'error' : ''}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="save-button"
              onClick={handleSave}
              disabled={disabled || !editData.fullName || !editData.phone || !editData.streetAddress || !editData.city}
            >
              <FiCheck size={14} />
              Save Address
            </button>
            {address && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
                disabled={disabled}
              >
                <FiX size={14} />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <style>{`
        .address-section {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s;
        }

        .address-section.has-error {
          border-color: #ef4444;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-dark);
          margin: 0;
        }

        .edit-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-mid);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-button:hover:not(:disabled) {
          background: var(--bg-section);
          border-color: #E45821;
          color: #E45821;
        }

        .edit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Display Mode */
        .address-display {
          background: var(--bg-section);
          border-radius: 12px;
          padding: 20px;
        }

        .address-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 8px;
        }

        .address-details {
          font-size: 0.875rem;
          color: var(--text-mid);
          line-height: 1.5;
        }

        .address-details div {
          margin-bottom: 4px;
        }

        .address-details div:last-child {
          margin-bottom: 0;
        }

        /* Form Mode */
        .address-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.span-2 {
          grid-column: span 2;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .form-group input,
        .form-group select {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.875rem;
          background: var(--bg);
          color: var(--text-dark);
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #E45821;
        }

        .form-group input.error,
        .form-group select.error {
          border-color: #ef4444;
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .save-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #E45821;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .save-button:hover:not(:disabled) {
          background: #d84f1b;
        }

        .save-button:disabled {
          background: #f0f0f0;
          cursor: not-allowed;
        }

        .cancel-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-mid);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button:hover:not(:disabled) {
          background: var(--bg-section);
          border-color: #ef4444;
          color: #ef4444;
        }

        .error-message {
          margin-top: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.875rem;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.span-2 {
            grid-column: span 1;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
