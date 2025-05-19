# FlutterBye CRM

![FlutterBye CRM](public/images/aot-labs-logo.png)

A mobile-first sales acceleration platform built with a unified architecture, single source of truth pattern, and AI-powered lead generation.

## Project Overview

FlutterBye CRM is a comprehensive customer relationship management system designed for sales professionals on the go. The application features intelligent lead management, call tracking, AI-powered lead generation, and a streamlined sales process optimized for both web and mobile use.

## Key Features

- **Intelligent Lead Management**: Organize, track, and manage leads with customizable statuses and priority levels
- **Call Tracking & Documentation**: Record calls, outcomes, and follow-up actions with automatic reminders
- **AI-Powered Lead Generation**: Generate new leads using natural language prompts and web search capabilities
- **Unified Architecture**: Single source of truth across all interfaces
- **Offline Capability**: Continue working without an internet connection using local data storage
- **Analytics Dashboard**: Track performance metrics and call outcomes
- **Team Lead Sharing**: Share leads with team members

## Technical Stack

### Backend
- **Language**: JavaScript & TypeScript (Node.js)
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod validation
- **Authentication**: JWT-based token authentication with refresh capability
- **AI Integration**: OpenRouter API for AI-powered features

### Frontend
- **Web Framework**: Vanilla JavaScript with modular architecture
- **Mobile Framework**: React Native with Expo
- **UI Components**: Native Base (mobile), Custom components (web)
- **Navigation**: React Navigation (mobile)
- **State Management**: Custom hooks with context API (mobile), Service-based architecture (web)
- **Local Storage**: Expo SQLite (mobile), browser localStorage (web)

## Refactored Architecture

The codebase has been completely refactored following a clean, layered architecture:

### Core Principles
- **Single Source of Truth**: Each piece of functionality exists in exactly one place
- **Clear Separation of Concerns**: Data, business logic, and UI layers are distinct
- **Consistent Interfaces**: Same APIs used across web and mobile
- **No Duplication**: Shared code whenever possible

### Web Architecture

```
/public/
├── js/
│   ├── core/           # Data & API layer
│   │   ├── api-client.js       # All API interactions
│   │   ├── lead-model.js       # Lead data structure & validation
│   │   ├── call-model.js       # Call data structure & validation
│   │   └── storage-manager.js  # Local storage/caching
│   ├── services/       # Business logic
│   │   ├── lead-service.js     # All lead operations
│   │   ├── call-service.js     # All call operations
│   │   └── sync-service.js     # Data synchronization
│   ├── components/     # UI components
│   │   ├── lead-card.js        # Single lead card implementation
│   │   ├── call-tracker.js     # Single call tracking UI
│   │   └── modal-manager.js    # Reusable modal system
│   └── pages/          # Page-specific controllers
│       ├── dashboard.js
│       ├── leads.js
│       └── calls.js
├── css/                # Styling
├── dashboard.html      # Main dashboard
├── leads.html          # Leads management 
└── calls.html          # Call management
```

### Mobile Architecture

```
/src/
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Application screens
│   ├── calls/          # Call-related screens
│   ├── leads/          # Lead-related screens
│   └── settings/       # Settings screens
├── services/           # Frontend services
└── utils/              # Utility functions
```

## Server Architecture

```
├── server/             # Backend server code
│   ├── auth.js         # Authentication setup
│   ├── db.js/ts        # Database connection
│   ├── index.js        # Express server setup
│   ├── routes/         # API routes
│   │   ├── ai.js       # AI-related API routes
│   │   ├── leads.js    # Lead management routes
│   │   └── organizations.js # Organization routes
│   ├── services/ai/    # AI service implementations
│   └── storage.js/ts   # Data access layer
├── shared/             # Shared code between client and server
│   └── db/             # Database schema definitions
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

### AI Features
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/web-search` - Perform web search with AI processing
- `POST /api/ai/leads/generate` - Generate leads based on criteria
- `POST /api/ai/leads/create` - Create leads from AI-generated lead data

### Organizations
- `GET /api/organizations` - Get organizations
- `GET /api/organization-members` - Get organization members

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- OpenRouter API key (for AI features)

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

### OpenRouter Setup

1. Register for an account at [OpenRouter](https://openrouter.ai/)
2. Create an API key in your OpenRouter dashboard
3. Add your API key to the environment variables:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

### Running the Application

```bash
# Start the server
node server/index.js

# Start the React Native application
npm start
```

## Development Tools

The project includes several workflow scripts for development and testing:

- **Schema Management**: Push database schema to PostgreSQL
  ```bash
  node scripts/push-schema.js
  ```

- **Admin Setup**: Create an admin user
  ```bash
  node scripts/admin-onboard.js
  ```

- **Demo Data**: Seed demonstration data
  ```bash
  node scripts/seed-demo-data.js
  ```

- **AI Testing**: Test OpenRouter API integration
  ```bash
  node scripts/test-openrouter.js
  ```

## Upcoming Improvements

- Complete unit tests for core classes
- End-to-end testing suite
- Remove remaining redundant files
- Update all React Native components to use the unified data models

## License

© 2025 FlutterBye CRM. All rights reserved.