import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = ({ flight, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    passengerFirstName: '',
    passengerMiddleName: '',
    passengerLastName: '',
    passengerDateOfBirth: '',
    numberOfPassengers: 1,
    useMiles: false,
    createMember: false
  });
  const [userMiles, setUserMiles] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in and get member info
    const checkMember = async () => {
      try {
        const oidcStorage = sessionStorage.getItem(`oidc.user:https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_EqOhYKs8N:5a536lkrvrnaolvdlopej7oj8c`);
        if (!oidcStorage) {
          setIsMember(false);
          return;
        }

        const memberApi = axios.create({
          baseURL: 'http://localhost:3002',
          timeout: 30000
        });
        const user = JSON.parse(oidcStorage);
        memberApi.defaults.headers.common['Authorization'] = `Bearer ${user.id_token}`;
        
        const res = await memberApi.get('/api/v1/Member/profile');
        setUserMiles(res.data.milesPoints);
        setIsMember(true);
        // Pre-fill passenger info from member profile
        setFormData(prev => ({
          ...prev,
          passengerFirstName: res.data.firstName,
          passengerLastName: res.data.lastName
        }));
      } catch (e) {
        // User not logged in or not a member - this is OK
        setIsMember(false);
        console.log('User is not a member or not logged in - this is normal');
      }
    };
    checkMember();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingApi = axios.create({
        baseURL: 'http://localhost:3003',
        timeout: 30000
      });
      const oidcStorage = sessionStorage.getItem(`oidc.user:https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_EqOhYKs8N:5a536lkrvrnaolvdlopej7oj8c`);
      if (oidcStorage) {
        const user = JSON.parse(oidcStorage);
        bookingApi.defaults.headers.common['Authorization'] = `Bearer ${user.id_token}`;
      }
      const res = await bookingApi.post('/api/v1/Booking/create', {
        flightId: flight.id,
        ...formData,
        passengerDateOfBirth: formData.passengerDateOfBirth || null
      });

      alert(`✅ Booking confirmed! Booking Number: ${res.data.bookingNumber}`);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = flight.price * formData.numberOfPassengers;
  const canUseMiles = isMember && userMiles >= totalPrice;

  return (
    <div className="booking-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="booking-form" style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: '#002060', marginBottom: '20px' }}>Passenger Information</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Title
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label><input type="radio" name="title" value="Mr" defaultChecked /> Mr.</label>
              <label><input type="radio" name="title" value="Ms" /> Ms.</label>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              First / Middle name (as shown on ID) *
            </label>
            <input
              type="text"
              required
              value={formData.passengerFirstName}
              onChange={e => setFormData({...formData, passengerFirstName: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Middle Name
            </label>
            <input
              type="text"
              value={formData.passengerMiddleName}
              onChange={e => setFormData({...formData, passengerMiddleName: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Surname (as shown on ID) *
            </label>
            <input
              type="text"
              required
              value={formData.passengerLastName}
              onChange={e => setFormData({...formData, passengerLastName: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date of Birth (DD/MM/YYYY)
            </label>
            <input
              type="date"
              value={formData.passengerDateOfBirth}
              onChange={e => setFormData({...formData, passengerDateOfBirth: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Number of Passengers
            </label>
            <select
              value={formData.numberOfPassengers}
              onChange={e => setFormData({...formData, numberOfPassengers: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>)}
            </select>
          </div>

          {!isMember && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.createMember}
                  onChange={e => setFormData({...formData, createMember: e.target.checked})}
                />
                <span>☐ I want to be a Miles&Smiles Member</span>
              </label>
            </div>
          )}

          {isMember && (
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Miles&Smiles Member</strong>
              </div>
              <div style={{ marginBottom: '10px' }}>
                Available Miles: <strong>{userMiles}</strong>
              </div>
              {canUseMiles && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.useMiles}
                    onChange={e => setFormData({...formData, useMiles: e.target.checked})}
                  />
                  <span>Pay with Miles ({totalPrice} miles required)</span>
                </label>
              )}
              {!canUseMiles && totalPrice > 0 && (
                <div style={{ color: '#E01E26', fontSize: '14px' }}>
                  Insufficient miles. Need {totalPrice} miles, you have {userMiles}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#002060', color: 'white', borderRadius: '4px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Total Price: {formData.useMiles ? '0 TL (Paid with Miles)' : `${totalPrice} TL`}</strong>
            </div>
            {formData.useMiles && (
              <div style={{ fontSize: '14px' }}>
                Miles to be used: {totalPrice}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#ccc',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#E01E26',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Processing...' : 'Complete Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
