# Voice Recorder PWA

## Overview

This is a Progressive Web App (PWA) for voice and video recording with advanced features including voice activation, local encryption, and offline functionality. The application provides a secure, privacy-focused recording experience with device-specific token generation and client-side data encryption.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme support (light/dark mode)
- **State Management**: React hooks with local state and React Query for data fetching
- **Router**: Wouter for lightweight client-side routing

### Progressive Web App Features
- **Service Worker**: Implements caching strategies for offline functionality
- **Web App Manifest**: Configured for installation and mobile app-like experience
- **Media APIs**: Utilizes MediaRecorder API and Web Speech API for recording and voice recognition

### Data Storage & Security
- **Local Storage**: IndexedDB wrapper for storing recordings, device tokens, and app settings
- **Encryption**: Client-side AES-GCM encryption using Web Crypto API with PBKDF2 key derivation
- **Device Authentication**: Unique device token generation for secure local storage

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: Drizzle ORM configured for PostgreSQL with Neon Database
- **Build System**: ESBuild for production server bundling
- **Development**: Vite middleware integration for hot reloading

### Core Application Flow
1. **Device Registration**: Generates unique cryptographic device token
2. **Permission Management**: Requests and manages microphone/camera permissions
3. **Voice Training**: Optional voice pattern recognition training
4. **Recording Interface**: Voice-activated or manual recording with real-time feedback

### Key Features
- **Voice Activation**: Configurable start/stop phrases using Web Speech API
- **Multi-format Recording**: Support for both audio (WebM/Opus) and video (WebM/VP8) recording
- **Local Encryption**: All recordings encrypted before storage using device-specific keys
- **Offline Operation**: Full functionality without internet connection after initial load
- **Theme System**: Dynamic light/dark theme switching with system preference detection

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **Build Tools**: Vite with React plugin, TypeScript compiler, ESBuild for production
- **UI Framework**: Radix UI component primitives, Tailwind CSS, Shadcn/ui components

### Database & Storage
- **Database**: Neon Database (PostgreSQL), Drizzle ORM with PostgreSQL dialect
- **Local Storage**: IndexedDB API (native browser), session storage for temporary data

### Media & Recording APIs
- **Recording**: MediaRecorder API (native browser), MediaDevices API for device access
- **Voice Recognition**: Web Speech API (native browser), Web Audio API for audio processing
- **Encryption**: Web Crypto API (native browser) for AES-GCM encryption

### Development & Deployment
- **Replit Integration**: Vite plugin for Replit environment, runtime error overlay
- **Utility Libraries**: Clsx for conditional classes, Date-fns for date manipulation
- **Form Handling**: React Hook Form with Zod validation, Hookform resolvers

### PWA Infrastructure
- **Service Workers**: Native browser API for caching and offline functionality
- **Web App Manifest**: Native browser support for app installation
- **Push Notifications**: Prepared for future implementation (not currently active)