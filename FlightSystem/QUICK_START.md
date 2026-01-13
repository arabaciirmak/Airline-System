# 🚀 Quick Start Guide

## Sistem Başlatma

### 1. Backend Servisleri

```bash
cd backend

# Docker ile (Önerilen)
docker-compose up -d postgres redis

# Servisleri başlat
npm run flight-service &
npm run member-service &
npm run booking-service &
npm run admin-service &
npm run notification-service &
npm run ml-service &
npm run api-gateway &
```

Veya tek komutla:
```bash
./start-all.sh
```

### 2. Frontend

```bash
cd ticketing-app
npm install
npm start
```

## 🌐 Erişim URL'leri

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:5000
- **Flight Service**: http://localhost:3001
- **Member Service**: http://localhost:3002
- **Booking Service**: http://localhost:3003
- **Admin Service**: http://localhost:3004
- **Notification Service**: http://localhost:3005
- **ML Service**: http://localhost:3006

## ✅ Test

### API Gateway Health Check
```bash
curl http://localhost:5000/health
```

### Flight Search Test
```bash
curl "http://localhost:5000/flight-api/api/v1/Flight/search?from=Istanbul&to=Ankara&date=2025-12-31&passengers=1"
```

### Airports List (Cached)
```bash
curl http://localhost:5000/flight-api/api/v1/Flight/airports
```

## 🔧 Sorun Giderme

### Port çakışması
```bash
# Kullanılan portları kontrol et
lsof -ti:3001,3002,3003,3004,3005,3006,5000

# Servisleri durdur
pkill -f "node services"
```

### Database bağlantı hatası
```bash
# PostgreSQL kontrol
docker-compose ps postgres

# Database oluştur
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE flight_system;"
```

### Redis bağlantı hatası
```bash
# Redis kontrol
docker-compose ps redis

# Redis test
redis-cli ping
```

## 📝 Notlar

- Email servisi için Gmail App Password gerekli (opsiyonel)
- AWS Cognito yapılandırması frontend'de mevcut
- RabbitMQ opsiyonel (fallback: in-memory queue)
