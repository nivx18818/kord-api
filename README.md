# Kord API

A real-time community platform backend inspired by Discord, built with NestJS, Prisma, and MySQL. Kord provides a complete REST API and WebSocket support for building modern chat applications with servers, channels, messaging, threading, reactions, roles, and user profiles.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

Kord is a Discord-inspired real-time community platform backend that enables:

- **User Authentication**: Cookie-based authentication with JWT access and refresh tokens
- **Servers**: Create and manage community spaces
- **Channels**: Text and voice channels with public, restricted, and private access
- **Messaging**: Rich message content with attachments, threading, and soft deletes
- **Reactions**: Emoji reactions on messages
- **Roles & Permissions**: Fine-grained role-based access control
- **Direct Messages**: Private DM channels between users
- **User Profiles**: Extended user information with social links

## Features

- ✅ **RESTful API** with comprehensive CRUD operations
- ✅ **Cookie-based Authentication** using JWT (access + refresh tokens)
- ✅ **Role-Based Access Control (RBAC)** with customizable permissions
- ✅ **Real-time WebSocket Support** for live updates
- ✅ **Threaded Conversations** with parent-child message relationships
- ✅ **Rich Message Content** with JSON-based content and file attachments
- ✅ **Server Invites** with expiration support
- ✅ **User Muting & Channel Blocking** for moderation
- ✅ **Soft Deletes** for message archival
- ✅ **Pagination Support** for large datasets
- ✅ **Comprehensive Validation** using class-validator
- ✅ **Database Migrations** with Prisma
- ✅ **Unit & E2E Testing** with Jest

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) 11.x
- **ORM**: [Prisma](https://www.prisma.io/) 6.x
- **Database**: MySQL
- **Authentication**: Passport.js (JWT + Local strategies)
- **Validation**: class-validator & class-transformer
- **Testing**: Jest & Supertest
- **Language**: TypeScript 5.x
- **WebSockets**: Socket.IO

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MySQL 8.x or higher
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/nivx18818/kord-api.git
cd kord-api
```

2. Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=mysql://username:password@localhost:3306/kord

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# JWT Expiration
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

### Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE kord CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Generate Prisma client:

```bash
npx prisma generate --schema prisma/schema.prisma
```

3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001/api/v1`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## API Documentation

The API is organized into the following modules:

- **[Authentication](docs/api/authentication.md)** - Register, login, logout, token refresh
- **[Users](docs/api/users.md)** - User management and profiles
- **[Servers](docs/api/servers.md)** - Server creation and management
- **[Channels](docs/api/channels.md)** - Channel operations and DMs
- **[Messages](docs/api/messages.md)** - Messaging and threading
- **[Reactions](docs/api/reactions.md)** - Emoji reactions
- **[Roles](docs/api/roles.md)** - Role and permission management
- **[Memberships](docs/api/memberships.md)** - Server member management

### Base URL

All API endpoints are prefixed with `/api/v1`:

```
http://localhost:3001/api/v1
```

### Authentication

Most endpoints require authentication via JWT tokens stored in HTTP-only cookies:

- `accessToken` - Short-lived token for API requests (15 minutes)
- `refreshToken` - Long-lived token for obtaining new access tokens (7 days)

### Quick Start Example

See the [Frontend Integration Guide](docs/frontend-guide.md) for detailed examples of integrating with a frontend application.

## Project Structure

```ini
kord-api/
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   └── migrations/           # Database migrations
├── src/
│   ├── common/               # Shared utilities and guards
│   │   ├── constants/          # Constants (permissions, error codes)
│   │   ├── decorators/         # Custom decorators
│   │   ├── dto/                # Shared DTOs
│   │   ├── exceptions/         # Custom exceptions
│   │   └── guards/             # Global guards (roles, etc.)
│   ├── modules/              # Feature modules
│   │   ├── auth/               # Authentication module
│   │   ├── users/              # User management
│   │   ├── servers/            # Server management
│   │   ├── channels/           # Channel management
│   │   ├── messages/           # Messaging
│   │   ├── reactions/          # Reactions
│   │   ├── roles/              # Roles and permissions
│   │   ├── memberships/        # Server memberships
│   │   ├── profiles/           # User profiles
│   │   ├── attachments/        # File attachments
│   │   └── prisma/             # Prisma service
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── test/                   # E2E tests
├── docs/                   # Documentation
├── bruno/                  # API test collections
└── generated/              # Generated Prisma client
```

## Development

### Code Style

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Validation**: class-validator decorators on DTOs

### Available Scripts

- `npm run build` - Build the application
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint and fix code with ESLint
- `npm run start` - Start the application
- `npm run start:dev` - Start in watch mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start production build

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Apply migrations (production)
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db push` - Push schema changes (dev only)

### Adding a New Module

1. Generate module: `nest g module modules/feature-name`
2. Generate controller: `nest g controller modules/feature-name`
3. Generate service: `nest g service modules/feature-name`
4. Create DTOs in `modules/feature-name/dto/`
5. Update Prisma schema if needed
6. Run `npx prisma generate` and `npx prisma migrate dev`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using [NestJS](https://nestjs.com/)**
