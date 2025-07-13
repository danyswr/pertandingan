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

### 2025-07-13 - Google Sheets Sync & Performance Fixes (IN PROGRESS)
- **Delete/Edit Sync Issue**: Fixed Google Sheets synchronization for athlete group edit and delete operations
- **Performance Optimization**: Improved delete operation speed by processing in background
- **Athlete Data Sync**: Enhanced athlete-to-group sync by auto-creating missing athletes from Google Sheets
- **UI Responsiveness**: Fixed edit dialog performance issues and removed unnecessary delays
- **Cache Management**: Added proper cache clearing to ensure fresh data after operations

### 2025-07-13 - Migration from Replit Agent & Layout Improvement (COMPLETED)
- **Migration Completed**: Successfully migrated the complete Taekwondo Tournament Management System from Replit Agent to standard Replit environment
- **Database Setup**: Created PostgreSQL database with proper schema migration and environment configuration
- **Layout Improvement**: Updated athlete group card layout with red and blue corners positioned on top and queue section below
- **WebSocket Functionality**: Real-time communication working properly with automatic reconnection
- **All Systems Operational**: API endpoints, frontend, database, and Google Sheets integration all functioning correctly

### 2025-07-12 - Complete CRUD Operations Fix for Tournament Management (COMPLETED)
- **Google Apps Script Fix**: Fixed missing `updateSubCategory` and `deleteSubCategory` actions causing edit/delete operations to show success toast but not actually update data
  - Added complete CRUD operations for Sub Categories: create, read, update, delete
  - Added complete CRUD operations for Athlete Groups: create, read, update, delete
  - Created `google-apps-script-tournament-fixed-crud.js` with all required actions
  - Enhanced error handling and validation for all tournament operations
- **Frontend Enhancement**: Added three-dot dropdown menus for edit/delete on sub categories and athlete groups
  - Edit dialogs for sub categories with proper form handling and validation
  - Proper mutation handlers for update and delete operations with cache invalidation
  - Improved user feedback with success/error toasts
- **Data Synchronization**: Fixed sync between frontend state, backend API, and Google Sheets
  - Update operations now properly modify Google Sheets data
  - Delete operations remove rows from Google Sheets
  - Real-time UI updates after successful operations

### 2025-07-12 - Enhanced Search & Filter Features + Google Apps Script Fix (COMPLETED)
- **Search & Filter Enhancement**: Added comprehensive search and filter functionality to tournament and matches pages
  - Tournament page: Enhanced athlete selection with search by name, filter by belt/gender/dojang, and sorting options
  - Matches page: Added search by athlete name, filter by status/ring, and improved match display
  - Real-time filter count display showing available athletes and match statistics
- **Google Apps Script Fix**: Fixed critical `nextId` undefined error in tournament management script
  - Corrected variable reference in `createAthleteGroup` function (line 79)
  - Created `google-apps-script-tournament-fixed-nextid.js` with proper error handling
- **UX Improvements**: Added reset filters functionality and automatic filter clearing when dialogs close
- **Performance**: Optimized filtering with client-side processing for instant results

### 2025-07-12 - Migration from Replit Agent to Standard Replit Environment (COMPLETED)
- **Migration Completed**: Successfully migrated the complete Taekwondo Tournament Management System from Replit Agent to standard Replit environment
- **Environment Verification**: Confirmed all packages installed correctly and workflow running properly on port 5000
- **WebSocket Functionality**: Verified real-time communication working with automatic reconnection
- **API Endpoints**: All dashboard APIs responding correctly with proper caching and performance
- **Database Integration**: PostgreSQL with Neon database and Drizzle ORM fully functional
- **Google Sheets Integration**: Existing Google Apps Script integration maintained and operational
- **Frontend Architecture**: React 18 with TypeScript, Wouter routing, and shadcn/ui components all working correctly
- **Security Practices**: Client/server separation maintained with proper session management
- **Sub-Categories Fix**: Resolved Google Sheets integration issue where sub-categories were not loading from SubKategori sheet

### 2025-07-12 - Hierarchical Tournament System Implementation
- **Tournament System Restructure**: Removed "Bracket Turnamen" navbar and integrated tournament management into matches page
- **Hierarchical Structure**: Implemented Main Categories → Sub Categories → Athlete Groups → Group Athletes flow
- **Card-based UI**: Created responsive card interface for each tournament level navigation
- **Match Management**: Built red vs blue corner match system with win buttons and automatic replacement
- **Queue System**: Implemented athlete queuing and automatic elimination management
- **Google Sheets Integration**: Added support for tournament sheets (Kategori_Utama, SubKategori, Kelompok_Atlet, daftar_kelompok)
- **CRUD Operations**: Full create, read, update, delete functionality for all tournament levels
- **Attendance Fix**: Resolved athlete sync issues for attendance updates with proper Google Sheets fallback

### 2025-07-12 - Migration from Replit Agent & Google Sheets Integration Fix
- **Migration Completed**: Successfully migrated project from Replit Agent to standard Replit environment
- **Google Sheets Tournament Support**: Added comprehensive tournament data sync to Google Sheets
  - Main Categories (Kategori_Utama): id_kategori, nama_kategori
  - Sub Categories (SubKategori): id_subkategori, id_kategori_utama, Nomor, judul_subkategori
  - Athlete Groups (Kelompok_Atlet): id_kel, id_SubKelompok, Judul, Nomor, Keterangan
  - Group Athletes (daftar_kelompok): id_daftarKelompok, id_kelompokAtlet, nama_atlet, etc.
- **UI Simplification**: Removed description field from main categories for cleaner interface
- **Enhanced Google Apps Script**: Added CRUD operations for tournament hierarchy (create, read, update, delete)
- **Real-time Sync**: Tournament data automatically syncs between web application and Google Sheets

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