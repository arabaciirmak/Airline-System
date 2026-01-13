-- Flight System Database Schema
-- Run this script to create the database schema

-- Create database (run this manually)
-- CREATE DATABASE flight_system;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    "flightCode" VARCHAR(20) UNIQUE NOT NULL,
    "fromCity" VARCHAR(100) NOT NULL,
    "toCity" VARCHAR(100) NOT NULL,
    "flightDate" TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    "availableSeats" INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    "isDirect" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table (Miles&Smiles)
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    "memberNumber" VARCHAR(50) UNIQUE NOT NULL,
    "cognitoUserId" VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE,
    email VARCHAR(255) NOT NULL,
    "milesPoints" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    "bookingNumber" VARCHAR(50) UNIQUE NOT NULL,
    "flightId" INTEGER NOT NULL REFERENCES flights(id),
    "memberId" INTEGER REFERENCES members(id),
    "cognitoUserId" VARCHAR(255),
    "passengerFirstName" VARCHAR(100) NOT NULL,
    "passengerMiddleName" VARCHAR(100),
    "passengerLastName" VARCHAR(100) NOT NULL,
    "passengerDateOfBirth" DATE,
    "numberOfPassengers" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10, 2) NOT NULL,
    "paidWithMiles" BOOLEAN DEFAULT false,
    "milesUsed" INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed',
    "flightCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Miles transactions table
CREATE TABLE IF NOT EXISTS miles_transactions (
    id SERIAL PRIMARY KEY,
    "memberId" INTEGER NOT NULL REFERENCES members(id),
    "bookingId" INTEGER REFERENCES bookings(id),
    miles INTEGER NOT NULL,
    "transactionType" VARCHAR(20) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights("flightDate");
CREATE INDEX IF NOT EXISTS idx_flights_route ON flights("fromCity", "toCity");
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings("memberId");
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings("flightId");
CREATE INDEX IF NOT EXISTS idx_members_cognito ON members("cognitoUserId");
CREATE INDEX IF NOT EXISTS idx_miles_member ON miles_transactions("memberId");
