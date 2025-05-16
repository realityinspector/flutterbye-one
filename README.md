# FlutterBye CRM

![FlutterBye CRM](public/images/aot-labs-logo.png)

A mobile-first sales acceleration platform built with React Native, Expo, PostgreSQL, and AI-powered lead generation.

## Project Overview

FlutterBye CRM is a comprehensive mobile customer relationship management system designed for sales professionals on the go. The application features intelligent lead management, call tracking, AI-powered lead generation, and a streamlined sales process optimized for mobile use.

## Key Features

- **Intelligent Lead Management**: Organize, track, and manage leads with customizable statuses and priority levels
- **Call Tracking & Documentation**: Record calls, outcomes, and follow-up actions with automatic reminders
- **AI-Powered Lead Generation**: Generate new leads using natural language prompts and web search capabilities
- **Mobile-First Design**: Optimized for sales professionals who need CRM access while away from their desk
- **Offline Capability**: Continue working without an internet connection using local data storage
- **User Setup Wizard**: Guided onboarding process for new users
- **Analytics Dashboard**: Track performance metrics and call outcomes
- **Team Lead Sharing**: Share leads with team members (planned feature)

## Technical Stack

### Backend
- **Language**: JavaScript & TypeScript (Node.js)
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod validation
- **Authentication**: JWT-based token authentication with refresh capability
- **AI Integration**: OpenRouter API for AI-powered features

### Frontend
- **Framework**: React Native with Expo
- **UI Components**: Native Base
- **Navigation**: React Navigation
- **State Management**: Custom hooks with context API
- **Local Storage**: Expo SQLite for offline data
- **Network Management**: NetInfo for connectivity monitoring

## Project Structure

```
├── server/             # Backend server code
│   ├── auth.js         # Authentication setup
│   ├── db.js/ts        # Database connection
│   ├── index.js        # Express server setup
│   ├── routes.js       # API routes
│   ├── routes/ai.js    # AI-related API routes
│   ├── services/ai/    # AI service implementations
│   └── storage.js/ts   # Data access layer
├── shared/             # Shared code between client and server
│   └── db/             # Database schema definitions
│       ├── schema.ts   # Drizzle ORM schema definitions
│       └── zod-schema.ts # Zod validation schemas and types
├── scripts/            # Utility scripts
│   ├── push-schema.js  # Database schema migration
│   ├── admin-onboard.js # Admin user setup script
│   ├── seed-demo-data.js # Demo data seeding script
│   └── test-openrouter.js # OpenRouter API test script
├── src/                # Frontend React Native code
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Application screens
│   ├── services/       # Frontend services (call handling, sync)
│   └── utils/          # Utility functions
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
- `GET /api/ai/interactions` - Get AI interactions for user
- `GET /api/ai/interactions/:id` - Get specific AI interaction

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/user-performance` - Get user performance (admin only)
- `GET /api/analytics/call-outcomes` - Get call outcome distribution

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

## Development Workflows

The project includes several workflow scripts for development and testing:

- **DBSetup**: Push database schema to PostgreSQL
  ```bash
  node scripts/push-schema.js
  ```

- **AdminOnboard**: Setup the first admin user
  ```bash
  node scripts/admin-onboard.js
  ```

- **DemoSeeder**: Seed demonstration data
  ```bash
  node scripts/seed-demo-data.js
  ```

- **TestOpenRouter**: Test OpenRouter API integration
  ```bash
  node scripts/test-openrouter.js
  ```

- **TestMoreLeads**: Test lead generation capabilities
  ```bash
  node scripts/test-more-leads.js
  ```

## Upcoming Features

- **Team Lead Sharing**: Share leads with team members
- **Enhanced Analytics**: More detailed performance metrics and visualizations
- **Call Recording**: Record and transcribe calls for better follow-up
- **Email Integration**: Send and track emails directly from the CRM

## License

© 2025 FlutterBye CRM. All rights reserved.