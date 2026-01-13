import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3004',
  timeout: 30000
});

const AdminPanel = () => {
    const [loading, setLoading] = useState(false);
    const [flight, setFlight] = useState({
        fromCity: 'Delhi', toCity: 'Mumbai', flightDate: '',
        flightCode: '', duration: '', capacity: '', price: ''
    });

    const handlePredict = async () => {
        if(!flight.flightDate || !flight.duration) {
            alert("Enter a date and duration!");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/v1/Admin/predict-price', {
                fromCity: flight.fromCity,
                toCity: flight.toCity,
                durationMinutes: parseFloat(flight.duration),
                flightDate: flight.flightDate
            });
            setFlight({ ...flight, price: res.data.predictedPrice + " TL" });
        } catch (err) {
            console.error("Predict error:", err);
            const errorMsg = err.response?.data?.error || err.message || "Tahmin başarısız!";
            alert(`Prediction fail: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if(!flight.price || !flight.flightCode || !flight.capacity) {
            alert("Please fill all fields and predict price first!");
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/v1/Admin/save-flight', {
                ...flight,
                duration: parseInt(flight.duration),
                capacity: parseInt(flight.capacity),
                price: parseFloat(flight.price.replace(" TL", ""))
            });
            alert("✅ Flight saved successfully!");
            setFlight({ fromCity: 'Delhi', toCity: 'Mumbai', flightDate: '', flightCode: '', duration: '', capacity: '', price: '' });
        } catch (err) {
            alert("Error during save!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="search-card" style={{ maxWidth: '700px', width: '100%' }}>
                <h2 style={{ color: '#002060', borderBottom: '2px solid #E01E26', paddingBottom: '10px' }}>✈️ Flight Administration</h2>
                
                <div className="search-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div className="input-box"><label>FROM CITY</label>
                        <input type="text" value={flight.fromCity} onChange={e => setFlight({...flight, fromCity: e.target.value})} /></div>
                    <div className="input-box"><label>TO CITY</label>
                        <input type="text" value={flight.toCity} onChange={e => setFlight({...flight, toCity: e.target.value})} /></div>
                    <div className="input-box"><label>FLIGHT DATE</label>
                        <input type="date" value={flight.flightDate} onChange={e => setFlight({...flight, flightDate: e.target.value})} /></div>
                    <div className="input-box"><label>FLIGHT CODE</label>
                        <input type="text" placeholder="Örn: TK123" value={flight.flightCode} onChange={e => setFlight({...flight, flightCode: e.target.value})} /></div>
                    <div className="input-box"><label>DURATION (MIN)</label>
                        <input type="number" value={flight.duration} onChange={e => setFlight({...flight, duration: e.target.value})} /></div>
                    <div className="input-box"><label>CAPACITY</label>
                        <input type="number" value={flight.capacity} onChange={e => setFlight({...flight, capacity: e.target.value})} /></div>

                    <div className="input-box" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 'bold', color: '#E01E26' }}>AI PREDICTED PRICE</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" value={flight.price} readOnly style={{ flex: 1, backgroundColor: '#f4f4f4', fontWeight: 'bold', color: '#002060', border: '2px solid #002060' }} />
                            <button onClick={handlePredict} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#002060', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {loading ? "..." : "Predict"}
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="search-trigger" style={{ width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#E01E26', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                    {loading ? "SAVING..." : "SAVE FLIGHT TO DATABASE"}
                </button>
            </div>
        </div>
    );
};

export default AdminPanel;