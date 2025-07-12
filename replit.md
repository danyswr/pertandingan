# Taekwondo Tournament Management System

## Overview

This is a comprehensive web-based Taekwondo tournament management system built with a modern full-stack architecture. The application enables tournament administrators to manage athlete registration, categorization, match scheduling, and real-time tournament operations with anti-clash scheduling capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Taekwondo-themed color palette
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Cloud Database**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Real-time Communication**: WebSockets for live updates

### External Integrations
- **Google Sheets API**: Primary data source for athlete information
- **Google Apps Script**: Backend integration for Google Sheets operations

## Key Components

### Database Schema
The system uses a relational database design with the following core entities:
- **Athletes**: Complete athlete profiles with physical stats and category assignments
- **Categories**: Tournament divisions based on weight, belt level, and gender
- **Groups**: Sub-divisions within categories for tournament bracketing
- **Matches**: Individual competition records with results tracking
- **Tournament Results**: Final standings and winner tracking

### Real-time System
- WebSocket server for multi-admin coordination
- Live updates for attendance tracking, match results, and scheduling changes
- Connection status monitoring with automatic reconnection

### Anti-Clash Scheduling
- Intelligent scheduling system preventing athlete conflicts
- Ring assignment management for concurrent matches
- Real-time availability tracking for athletes across multiple categories

## Data Flow

1. **Athlete Data Sync**: Google Sheets → Google Apps Script → Express API → PostgreSQL
2. **Category Management**: React UI → Express API → Database validation → Real-time broadcast
3. **Match Scheduling**: Category grouping → Bracket generation → Ring assignment → WebSocket updates
4. **Live Tournament**: Match updates → Database → WebSocket broadcast → UI refresh

## External Dependencies

### Core Dependencies
- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `connect-pg-simple`
- **UI Components**: `@radix-ui/*` component suite, `class-variance-authority`
- **State Management**: `@tanstack/react-query`, `react-hook-form`
- **Real-time**: `ws` (WebSocket server)
- **Validation**: `zod`, `drizzle-zod`

### Development Tools
- **Build**: Vite with TypeScript, PostCSS, Autoprefixer
- **Database**: Drizzle Kit for migrations and schema management
- **Styling**: Tailwind CSS with custom configuration

## Deployment Strategy

### Development Environment
- Local development server with Vite HMR
- In-memory or local PostgreSQL database
- Google Sheets integration via Apps Script URLs

### Production Environment
- **Build Process**: Vite production build + esbuild for server bundling
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Static Assets**: Served through Express with optimized caching
- **Environment Variables**: Database URL and Google Sheets API endpoints

### Key Configuration
- **Database Migrations**: Automated via Drizzle Kit
- **Session Storage**: PostgreSQL-backed for multi-instance support
- **WebSocket Scaling**: Single-instance with potential for Redis adapter
- **Google Sheets**: External API integration with configurable endpoints

## Recent Changes

### 2025-07-12 - Migration from Replit Agent & Performance Optimization
- **Migration Completed**: Successfully migrated project from Replit Agent to standard Replit environment
- **Performance Optimization**: Attendance updates now respond in 1ms (previously 2+ seconds) with asynchronous Google Sheets sync
- **Google Sheets Direct Reading**: Fixed athlete data display to read directly from `atlets` sheet in Google Sheets
- **Import Workflow**: "Pilih Kejuaraan" now only used for importing new athletes, not for viewing existing data
- **Data Persistence**: Athlete data now persists and displays immediately upon page refresh
- **Code Quality**: Fixed duplicate key warnings in month mapping for date parsing
- **API Endpoints**: Enhanced `/api/athletes` endpoint with improved caching and error handling
- **Google Apps Script**: Updated script with proper attendance update handling and better error logging

### 2025-01-11 - Performance Optimization & Real-time Enhancements
- **Caching System**: Implemented server-side caching for Google Sheets data with 30-second TTL
- **Real-time Updates**: Enhanced WebSocket functionality with automatic reconnection
- **API Optimization**: Added cache headers and request timeouts for faster data retrieval
- **UI Improvements**: Added refresh buttons and connection status indicators
- **Auto-refresh**: Implemented automatic data refresh every 30 seconds for athlete data
- **Google Sheets Integration**: Optimized integration with new management spreadsheet URL

The system is designed for tournament organizers who need real-time coordination capabilities, automated bracket management, and seamless integration with existing Google Sheets workflows for athlete registration.