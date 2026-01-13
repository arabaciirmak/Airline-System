import { useAuth } from "react-oidc-context";
import axios from "axios";
import { useState, useEffect } from "react";
import "./App.css";
import AdminPanel from "./AdminPanel";
import BookingForm from "./BookingForm";

function App() {
  const auth = useAuth();
  const [flights, setFlights] = useState([]);
  const [view, setView] = useState("home");
  const [userMiles, setUserMiles] = useState(0);
  const [params, setParams] = useState({ from: "", to: "", date: "", passengers: 1 });
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [isDirect, setIsDirect] = useState(false);
  const [isFlexible, setIsFlexible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const flightApi = axios.create({
          baseURL: 'http://localhost:3001',
          timeout: 30000
        });
        const res = await flightApi.get('/api/v1/Flight/airports');
        if (res.data.airports && res.data.airports.length > 0) {
          setCities(res.data.airports.sort());
        } else {
          setCities([
            'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bodrum',
            'London', 'Paris', 'Dubai', 'Delhi', 'Mumbai',
            'New York', 'Tokyo', 'Berlin', 'Rome', 'Madrid'
          ]);
        }
      } catch (e) {
        setCities([
          'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bodrum',
          'London', 'Paris', 'Dubai', 'Delhi', 'Mumbai',
          'New York', 'Tokyo', 'Berlin', 'Rome', 'Madrid'
        ]);
      }
    };
    fetchCities();
  }, []);

  const isAdmin = auth.isAuthenticated && 
                  auth.user?.profile["cognito:groups"]?.includes("Admin");

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      
      const targetView = sessionStorage.getItem("postLoginRedirect");
      
      if (targetView === "admin" && isAdmin) {
        setView("admin");
        sessionStorage.removeItem("postLoginRedirect");
      }

      if (!isAdmin) fetchMiles();
    }
  }, [auth.isAuthenticated, auth.isLoading, isAdmin]);

  const fetchMiles = async () => {
    try {
      const memberApi = axios.create({
        baseURL: 'http://localhost:3002',
        timeout: 30000
      });
      const oidcStorage = sessionStorage.getItem(`oidc.user:https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_EqOhYKs8N:5a536lkrvrnaolvdlopej7oj8c`);
      if (oidcStorage) {
        const user = JSON.parse(oidcStorage);
        memberApi.defaults.headers.common['Authorization'] = `Bearer ${user.id_token}`;
      }
      const res = await memberApi.get('/api/v1/Member/profile');
      setUserMiles(res.data.milesPoints);
    } catch (e) { console.error("Mil hatası", e); }
  };

  const handleAdminEntry = () => {
    if (!auth.isAuthenticated) {
      sessionStorage.setItem("postLoginRedirect", "admin");
      auth.signinRedirect();
    } else if (isAdmin) {
      setView("admin");
    } else {
      alert("Npt an admin!");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setView("home");
    auth.signoutRedirect();
  };

  const handleSearch = async () => {
    if (!params.from || !params.to || !params.date) {
      alert("Please fill FROM, TO and DEPARTURE fields!");
      return;
    }
    
    try {
      const flightApi = axios.create({
        baseURL: 'http://localhost:3001',
        timeout: 30000
      });
      let url = `/api/v1/Flight/search?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}&date=${params.date}&passengers=${params.passengers}`;
      if (isDirect) url += '&direct=true';
      if (isFlexible) url += '&flexible=true';
      
      console.log('Searching with URL:', url);
      const res = await flightApi.get(url);
      console.log('Search results:', res.data);
      const flights = res.data.flights || [];
      setFlights(flights);
      
      if (flights.length === 0) {
        alert("Flight cannot be found. Please try a different date or city.");
      }
    } catch (e) { 
      console.error("Flight search error:", e);
      alert("Flight search failed: " + (e.message || "Unknown error"));
    }
  };

  const handleBookingSuccess = () => {
    setSelectedFlight(null);
    fetchMiles();
    handleSearch();
  };

  if (auth.isLoading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="App">
      <nav className="navbar">
        <div className="brand" onClick={() => setView("home")} style={{cursor:'pointer'}}>YAŞAR AIRLINE</div>
        <div className="nav-right">
          {auth.isAuthenticated && !isAdmin && <div className="miles-info">⭐ {userMiles} Miles</div>}
          
          {}
          <button onClick={handleAdminEntry} className="admin-entry-btn">Admin Panel</button>

          {!auth.isAuthenticated ? (
            <button className="admin-entry-btn" onClick={() => auth.signinRedirect()}>Sign In</button>
          ) : (
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </nav>

      {view === "admin" && isAdmin ? (
        <div style={{paddingTop:'50px'}}><AdminPanel /></div>
      ) : (
        <>
          <header className="hero">
            <h1>Widen Your World</h1>
            <p>Experience the privilege of Yaşar Airline</p>
          </header>
          
          <div className="search-container-fixed">
            <div className="search-tabs">
              <button className={`tab ${isRoundTrip ? 'active' : ''}`} onClick={() => setIsRoundTrip(true)}>Round Trip</button>
              <button className={`tab ${!isRoundTrip ? 'active' : ''}`} onClick={() => setIsRoundTrip(false)}>One Way</button>
            </div>
            
            <div className="search-row">
              <div className="input-box">
                <label>FROM</label>
                <select 
                  value={params.from} 
                  onChange={e => setParams({...params, from: e.target.value})}
                  style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="input-box">
                <label>TO</label>
                <select 
                  value={params.to} 
                  onChange={e => setParams({...params, to: e.target.value})}
                  style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="input-box"><label>DEPARTURE</label><input type="date" onChange={e => setParams({...params, date: e.target.value})} /></div>
              {isRoundTrip && <div className="input-box"><label>RETURN</label><input type="date" /></div>}
              <div className="input-box">
                <label>PASSENGERS</label>
                <select value={params.passengers} onChange={e => setParams({...params, passengers: parseInt(e.target.value)})}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>)}
                </select>
              </div>
              <button className="search-trigger" onClick={handleSearch}>🔍</button>
            </div>
            <div className="search-filters" style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isDirect} onChange={e => setIsDirect(e.target.checked)} />
                <span>Direct Flight Only</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isFlexible} onChange={e => setIsFlexible(e.target.checked)} />
                <span>Flexible Dates (±3 days)</span>
              </label>
            </div>
          </div>

          <div className="flight-results" style={{padding: '20px', minHeight: '200px'}}>
            {flights.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px', color: '#666', backgroundColor: 'white', borderRadius: '8px', margin: '20px'}}>
                <p style={{fontSize: '18px', marginBottom: '10px'}}>Flight not found</p>
                <p style={{fontSize: '14px'}}>Please try different criteria or add flights via Admin Panel.</p>
              </div>
            ) : (
              flights.map(f => (
                <div className="flight-card" key={f.id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '10px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <strong style={{fontSize: '18px', color: '#002060'}}>{f.fromCity} ➔ {f.toCity}</strong>
                    <br/>
                    <small style={{color: '#666'}}>{f.flightCode}</small>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold'}}>{f.duration} mins</div>
                    <small style={{color: '#666'}}>{new Date(f.flightDate).toLocaleDateString('tr-TR')}</small>
                  </div>
                  <div className="price-tag" style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#E01E26'
                  }}>
                    {parseFloat(f.price).toFixed(2)} TL
                    <br/>
                    <small style={{fontSize: '12px', color: '#666'}}>{f.availableSeats} seat available</small>
                  </div>
                  <button 
                    className="book-btn" 
                    onClick={() => setSelectedFlight(f)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#E01E26',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
          
          {selectedFlight && (
            <BookingForm
              flight={selectedFlight}
              onClose={() => setSelectedFlight(null)}
              onSuccess={handleBookingSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;