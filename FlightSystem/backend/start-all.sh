#!/bin/bash

# Start all services in the background
echo "Starting Flight System services..."

# Start services
node services/flight-service/index.js &
FLIGHT_PID=$!

node services/member-service/index.js &
MEMBER_PID=$!

node services/booking-service/index.js &
BOOKING_PID=$!

node services/admin-service/index.js &
ADMIN_PID=$!

node services/notification-service/index.js &
NOTIFICATION_PID=$!

node services/ml-service/index.js &
ML_PID=$!

node services/scheduler/index.js &
SCHEDULER_PID=$!

# Wait a bit for services to start
sleep 3

# Start API Gateway
node services/api-gateway/index.js &
GATEWAY_PID=$!

echo "All services started!"
echo "Flight Service PID: $FLIGHT_PID"
echo "Member Service PID: $MEMBER_PID"
echo "Booking Service PID: $BOOKING_PID"
echo "Admin Service PID: $ADMIN_PID"
echo "Notification Service PID: $NOTIFICATION_PID"
echo "ML Service PID: $ML_PID"
echo "Scheduler PID: $SCHEDULER_PID"
echo "API Gateway PID: $GATEWAY_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $FLIGHT_PID $MEMBER_PID $BOOKING_PID $ADMIN_PID $NOTIFICATION_PID $ML_PID $SCHEDULER_PID $GATEWAY_PID; exit" INT
wait
