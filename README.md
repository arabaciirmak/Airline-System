# Flight System - Airline Ticketing System

A comprehensive airline ticketing system similar to turkishairlines.com, built as a microservices architecture with modern cloud deployment capabilities.

## 🏗️ Architecture

The system is built using a microservices architecture with the following components:

### Services

1. **Flight Service** (Port 3001)
   - Flight search with filtering (direct flights, flexible dates)
   - Airport and destination caching (Redis)
   - Flight availability management

2. **Member Service** (Port 3002)
   - Miles&Smiles membership management
   - Member registration and profile management
   - Miles points management
   - External airline miles integration (authenticated)

3. **Booking Service** (Port 3003)
   - Ticket booking and reservation
   - Capacity management
   - Miles-based payment processing
   - Booking confirmation

4. **Admin Service** (Port 3004)
   - Flight administration (add/update flights)
   - Price prediction using ML service
   - Flight management with pagination

5. **Notification Service** (Port 3005)
   - Email notifications (welcome emails, booking confirmations, miles updates)
   - Queue-based message processing
   - Gmail SMTP integration

6. **ML Service** (Port 3006)
   - Flight price prediction based on:
     - Duration
     - Date (season, weekend/weekday)
     - Route popularity
     - Historical patterns

7. **Scheduler Service**
   - Nightly job to add miles for completed flights
   - Automated email notifications for miles updates
   - Queue processing for new members

8. **API Gateway** (Port 5000)
   - Single entry point for all services
   - Request routing and load balancing
   - Authentication middleware

### Frontend

- **React Application** (Port 3000)
  - Flight search with filters
  - Booking flow with passenger information
  - Miles&Smiles integration
  - Admin panel for flight management
  - AWS Cognito authentication

## 🗄️ Database Schema

### Tables

- **flights**: Flight information, capacity, pricing
- **members**: Miles&Smiles member profiles
- **bookings**: Ticket reservations and passenger information
- **miles_transactions**: Miles earning and usage history

See `backend/scripts/migrations.sql` for complete schema.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis
- RabbitMQ (optional, falls back to in-memory queue)
- Docker & Docker Compose (for containerized deployment)

## 🔐 Authentication

The system uses **AWS Cognito** for authentication:

- User Pool ID: `eu-north-1_EqOhYKs8N`
- Region: `eu-north-1`
- Admin users must be in the "Admin" Cognito group

### Setting up Cognito

1. Create a Cognito User Pool in AWS
2. Create an App Client
3. Create an "Admin" group and assign admin users
4. Update `ticketing-app/src/index.js` with your Cognito configuration

## 📧 Email Configuration

The system uses Gmail SMTP for sending emails. Configure in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note**: Use an App Password, not your regular Gmail password. Enable 2FA and generate an app password in your Google Account settings.

## 🔄 Queue System

The system uses **RabbitMQ** for asynchronous message processing:

- **new_member_queue**: New member registrations
- **booking_queue**: Booking confirmations
- **miles_added_queue**: Miles update notifications

If RabbitMQ is not available, the system falls back to in-memory processing (for development).

## 💾 Caching

**Redis** is used for caching:

- Airport names list
- Destination cities
- Cache TTL: 1 hour

## 📋 API Endpoints

### Flight Service
- `GET /api/v1/Flight/search` - Search flights
- `GET /api/v1/Flight/:id` - Get flight details
- `GET /api/v1/Flight/airports` - Get airports (cached)
- `GET /api/v1/Flight/destinations` - Get destinations (cached)

### Member Service
- `GET /api/v1/Member/profile` - Get member profile
- `POST /api/v1/Member/register` - Register new member
- `POST /api/v1/Member/add-miles` - Add miles (external airlines)
- `GET /api/v1/Member/:memberNumber` - Get member by number

### Booking Service
- `POST /api/v1/Booking/create` - Create booking
- `GET /api/v1/Booking/:bookingNumber` - Get booking details
- `GET /api/v1/Booking/user/bookings` - Get user bookings

### Admin Service
- `POST /api/v1/Admin/predict-price` - Predict flight price (ML)
- `POST /api/v1/Admin/save-flight` - Save new flight
- `GET /api/v1/Admin/flights` - List flights (paginated)

All endpoints are versioned (`/api/v1/`) and accessible through the API Gateway at `http://localhost:5000`.

## 🎯 Features Implemented
### ✅ Functional Requirements
- [x] **Add Flights**: Admin can add flights with ML price prediction
- [x] **Search Flights**: Search by airport, dates, passengers with filters
- [x] **Direct Flight Filter**: Filter for direct flights only
- [x] **Flexible Dates**: Search with ±3 days flexibility
- [x] **Buy Ticket**: Complete booking flow with passenger information
- [x] **Miles&Smiles Integration**:
  - Member login and auto-fill passenger info
  - Pay with miles points
  - New member registration during booking
- [x] **Capacity Management**: Automatic seat reduction on booking
- [x] **Add Miles**: Nightly process to add miles for completed flights
- [x] **External Airlines**: Authenticated API to add miles from partner airlines
- [x] **Email Notifications**:
  - Welcome emails for new members
  - Booking confirmations
  - Miles added notifications

### ✅ Non-Functional Requirements
- [x] **Microservices Architecture**: Separate services for each domain
- [x] **API Gateway**: Single entry point for all services
- [x] **Authentication**: AWS Cognito integration
- [x] **Queue System**: RabbitMQ for async processing
- [x] **Caching**: Redis for airports and destinations
- [x] **Scheduled Tasks**: Cron jobs for miles and emails
- [x] **API Versioning**: All endpoints use `/api/v1/`
- [x] **Pagination**: Admin flights endpoint supports pagination
- [x] **Docker Support**: Dockerfile for each service
- [x] **Database**: PostgreSQL with proper schema

## 📊 Data Models
### ER Diagram
```
┌─────────────┐         ┌──────────────┐
│   Flight    │◄────────│   Booking    │
│             │         │              │
│ - id        │         │ - id         │
│ - flightCode│         │ - bookingNum │
│ - fromCity  │         │ - flightId   │
│ - toCity    │         │ - memberId   │
│ - date      │         │ - passengers │
│ - capacity  │         │ - totalPrice │
│ - price     │         │ - milesUsed  │
└─────────────┘         └──────┬───────┘
                              │
                              │
┌─────────────┐         ┌──────▼───────────┐
│   Member    │◄────────│ MilesTransaction │
│             │         │                  │
│ - id        │         │ - id             │
│ - memberNum │         │ - memberId       │
│ - cognitoId │         │ - bookingId      │
│ - firstName │         │ - miles          │
│ - lastName  │         │ - type           │
│ - email     │         └─────────────────-┘
│ - milesPoints│
└─────────────┘
```

## 📝 Assumptions
1. **Price Calculation**: 1 mile = 1 TL for simplicity
2. **Miles Earning**: Miles are added based on ticket price (1:1 ratio)
3. **Flight Completion**: Flights are considered completed 1 day after flight date
4. **ML Model**: Simple heuristic-based prediction (can be replaced with trained model)
5. **Email Service**: Gmail SMTP (can be replaced with SendGrid, SES, etc.)
6. **Queue Fallback**: In-memory queue if RabbitMQ unavailable (development only)

## 🎥 Video Presentation
[Click here to view the video](https://drive.google.com/file/d/11q3QEVRsJBwEOCU7EHHgWJsD_oqoUb3r/view?usp=sharing)
