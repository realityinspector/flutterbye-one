# Walk N Talk CRM

A mobile-first sales acceleration platform built with React Native, Expo, and PostgreSQL.

## Project Overview

Walk N Talk CRM is a comprehensive mobile customer relationship management system designed for sales professionals on the go. The application features lead management, call tracking, and a streamlined sales process, all optimized for mobile use.

## Features Implemented

- **Database Schema**: PostgreSQL database with tables for users, leads, and call tracking
- **Authentication System**: Complete user authentication with registration, login, and JWT-based token management
- **API Endpoints**: RESTful API endpoints for all CRM functionalities
- **User Roles**: Admin and regular user roles with different permissions
- **First-User Detection**: Special admin privileges for the first registered user

## Technical Stack

### Backend
- **Language**: JavaScript (Node.js)
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT-based token authentication with refresh capability

### Frontend
- **Framework**: React Native with Expo
- **State Management**: React Query
- **UI Components**: Native Base
- **Navigation**: React Navigation

## Project Structure

```
├── server/             # Backend server code
│   ├── auth.js         # Authentication setup
│   ├── db.js           # Database connection (CommonJS)
│   ├── db.ts           # TypeScript database connection
│   ├── index.js        # Express server setup
│   ├── routes.js       # API routes
│   ├── storage.js      # Data access layer (CommonJS)
│   └── storage.ts      # TypeScript data access layer
├── shared/             # Shared code between client and server
│   └── db/             # Database schema definitions
│       ├── index.ts    # Exports for TypeScript imports
│       ├── schema.js   # CommonJS schema for Node.js
│       ├── schema.ts   # TypeScript schema definitions
│       └── zod-schema.ts # Zod validation schemas and types
├── scripts/            # Utility scripts
│   ├── push-schema.js  # Database schema migration
│   ├── minimal-server.js # Minimal test server
│   └── start-server.js # Server startup script
├── src/                # Frontend React Native code
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Application screens
│   └── utils/          # Utility functions
└── App.jsx            # Root application component
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user (returns JWT token)
- `POST /api/login` - Login a user (returns JWT token)
- `POST /api/logout` - Logout a user
- `GET /api/user` - Get the current user's data (requires authentication)
- `POST /api/refresh` - Refresh an existing JWT token

### Leads
- `GET /api/leads` - Get all leads for the current user
- `GET /api/leads/:id` - Get a specific lead by ID
- `POST /api/leads` - Create a new lead
- `PUT /api/leads/:id` - Update a lead
- `DELETE /api/leads/:id` - Delete a lead

### Calls
- `GET /api/calls` - Get all calls for the current user
- `GET /api/leads/:leadId/calls` - Get all calls for a specific lead
- `POST /api/calls` - Create a new call record

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```

### Database Setup

The application requires a PostgreSQL database. The schema can be created by running:

```bash
# Push the schema to the database
node scripts/push-schema.js
```

### Running the Application

```bash
# Start the server
node scripts/start-server.js

# Start the React Native application
npm start
```

## Development Status

The project has implemented the basic infrastructure and API endpoints. Recent updates include:

- JWT-based authentication system has been completed, replacing the previous session-based authentication
- Token refresh mechanism for extending sessions without requiring re-login
- Updated authorization middleware for API routes
- Improved database schema organization with TypeScript and Zod integration
  - Moved Drizzle models to `/shared/db/` directory
  - Created TypeScript schema definitions with proper types
  - Added Zod validation schemas for runtime type checking
  - Maintained backward compatibility with CommonJS for Node.js

Next steps include implementing frontend consumption of the Zod types and building out the mobile interface according to the streamlined feature set detailed in CHANGE-ROUND.md.

## License

This project is proprietary and confidential.
