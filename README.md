# Shortify

A full-stack URL shortening and link management platform built with
**React, Node.js, Express, PostgreSQL, and Redis**.

Shortify allows users to create short URLs, manage their links, monitor
click activity, generate QR codes, control link availability, and
securely manage their accounts from a single workspace.

# Shortify - URL Shortener

🔗 **Live Demo:** https://shrtfy.cloud

------------------------------------------------------------------------

## What Problem Does Shortify Solve?

Long URLs can be difficult to share, remember, manage, and use in
situations where space is limited.

Creating a short link solves only part of the problem. Once links are
created, users may also need to:

-   Manage multiple shortened URLs
-   Track how their links are being used
-   Disable links when they are no longer required
-   Set expiration times
-   Share links through QR codes
-   Protect their account and link data

**Shortify combines URL shortening, link management, analytics, and
security into one application.**

------------------------------------------------------------------------

## Why Shortify?

Shortify was built as a practical full-stack engineering project to
explore how a real URL-shortening service can be designed beyond simply
generating short links.

The project focuses on:

-   Authentication and authorization
-   Relational database design
-   Redis caching
-   Redirect performance
-   Click analytics
-   Password recovery
-   API rate limiting
-   Security headers
-   Environment-based configuration
-   Cloud deployment

------------------------------------------------------------------------

## How It Works

``` text
                    User
                      |
                      v
              React + Vite
                      |
                  REST API
                      |
                      v
              Node.js + Express
                 |          |
                 |          |
                 v          v
            PostgreSQL    Redis
                 |          |
                 |          +-- Redirect Cache
                 |          +-- OTP Storage
                 |          +-- Rate Limiting
                 |
                 +-- Users
                 +-- Short URLs
                 +-- Clicks
```

## URL Redirect Flow

``` text
User opens short URL
        |
        v
   Express Server
        |
        v
   Check Redis Cache
        |
   +----+-----+
   |          |
Cache Hit   Cache Miss
   |          |
   |          v
   |      PostgreSQL
   |          |
   +----+-----+
        |
        v
Validate Status / Expiry
        |
        v
   Record Click
        |
        v
Redirect to Destination
```

------------------------------------------------------------------------

# Features

## URL Shortening

Create short, shareable URLs from long destination URLs.

Example:

``` text
https://shrtfy.cloud/abc123
```

## Link Management

Authenticated users can manage their shortened URLs from their
workspace.

Users can:

-   Search links
-   Filter links
-   Copy short URLs
-   View click counts
-   View expiration information
-   Disable links
-   View individual analytics
-   Generate QR codes

## Analytics

Shortify records click activity for shortened URLs.

Click information can include:

-   Click time
-   User agent
-   Referrer

## QR Codes

Generate QR codes for shortened URLs, making links easier to use in
physical and offline environments.

Useful for:

-   Posters
-   Documents
-   Presentations
-   Printed material
-   Events

## Link Expiration

Links can have an expiration time.

Once a link expires, Shortify prevents it from continuing to redirect to
the destination.

## Link Controls

Users can disable shortened links when they are no longer required.

Disabled links cannot be used for redirection.

Redis cache entries are invalidated when links are disabled to prevent
stale redirects.

## Authentication

Shortify provides authenticated user accounts using JWT-based
authentication.

Authentication protects user-specific resources including:

-   Short URLs
-   Analytics
-   Link management
-   Guardian
-   Account operations

## Password Reset

Password recovery uses an OTP-based flow.

The process includes:

1.  User requests password recovery.
2.  An OTP is generated.
3.  The OTP is stored securely using Redis.
4.  The OTP expires after a limited period.
5.  Incorrect attempts are limited.
6.  The password is updated after successful verification.
7.  Temporary OTP data is removed.

OTP values are hashed before being stored.

## Guardian

Guardian provides a dedicated interface for checking and monitoring
links.

Users can inspect their links and perform link health checks from the
application.

------------------------------------------------------------------------

# Security

Security is treated as part of the application rather than an
afterthought.

Shortify includes:

-   JWT authentication
-   Password hashing with bcrypt
-   Hashed OTP storage
-   OTP expiration
-   OTP attempt limits
-   Ownership-based authorization
-   Redis-backed API rate limiting
-   CORS configuration
-   Helmet security headers
-   Environment-based secrets
-   Link expiration validation
-   Disabled-link validation
-   Redis cache invalidation

### API Rate Limiting

API access is rate limited to reduce excessive requests and abuse.

Redis is used to maintain rate-limit information.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React
-   Vite
-   JavaScript
-   CSS

## Backend

-   Node.js
-   Express.js
-   JWT
-   bcrypt
-   Nodemailer

## Database

-   PostgreSQL

## Caching

-   Redis

## Development & Deployment

-   Git
-   GitHub
-   Docker
-   Docker Compose
-   Nginx
-   AWS

------------------------------------------------------------------------

# Project Structure

``` text
Shortify/
|
+-- backend/
|   |
|   +-- db/
|   |   +-- schema.sql
|   |
|   +-- middleware/
|   |   +-- auth.js
|   |
|   +-- routes/
|   |   +-- analytics.js
|   |   +-- guardian.js
|   |   +-- passwordReset.js
|   |
|   +-- scripts/
|   |   +-- create-user.js
|   |
|   +-- .env.example
|   +-- config_postgres.js
|   +-- config_redis.js
|   +-- index.js
|   +-- package.json
|   +-- package-lock.json
|
+-- frontend/
|   |
|   +-- public/
|   |
|   +-- src/
|       |
|       +-- components/
|       |   +-- ProtectedRoute.jsx
|       |
|       +-- pages/
|       |   +-- About.jsx
|       |   +-- Analytics.jsx
|       |   +-- ForgotPassword.jsx
|       |   +-- Guardian.jsx
|       |   +-- Home.jsx
|       |   +-- Login.jsx
|       |   +-- Register.jsx
|       |   +-- ResetPassword.jsx
|       |
|       +-- services/
|       |   +-- api.js
|       |   +-- auth.js
|       |
|       +-- App.css
|       +-- App.jsx
|       +-- analytics.css
|       +-- guardian.css
|       +-- index.css
|       +-- main.jsx
|   |
|   +-- .env.example
|   +-- Dockerfile
|   +-- nginx.conf
|   +-- index.html
|   +-- package.json
|   +-- package-lock.json
|
+-- docker-compose.yml
+-- .gitignore
```

------------------------------------------------------------------------

# Database Design

Shortify uses PostgreSQL as its primary relational database.

``` text
users
  |
  | 1:N
  v
short_urls
  |
  | 1:N
  v
clicks
```

### Users

Stores authenticated application users.

### Short URLs

Stores:

-   Owner
-   Short code
-   Destination URL
-   Click count
-   Status
-   Expiration time
-   Creation time

### Clicks

Stores click activity associated with shortened URLs.

------------------------------------------------------------------------

# Redis Usage

Redis is used for multiple application-level responsibilities.

## Redirect Caching

Frequently accessed short URLs can be served from Redis without querying
PostgreSQL for every redirect.

Cached redirect information contains:

-   Link ID
-   Destination
-   Status
-   Expiration

The backend validates status and expiration even when a value comes from
cache.

## Password Reset

Redis temporarily stores password-reset information such as:

-   OTP
-   Expiration
-   Verification attempts

## Rate Limiting

Redis tracks API request limits.

------------------------------------------------------------------------

# Environment Variables

Real environment files are intentionally excluded from Git.

Use the provided templates:

``` text
backend/.env.example
frontend/.env.example
```

Create local `.env` files from these templates and provide your own
values.

## Backend

``` env
PORT=3000
BASE_URL=http://localhost:3000

DATABASE_URL=postgresql://username:password@host:5432/shortify

REDIS_URL=redis://127.0.0.1:6379

JWT_SECRET=your_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email
```

## Frontend

``` env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_BASE_URL=http://localhost:3000
```

**Never commit real credentials, API keys, passwords, JWT secrets, or
SMTP credentials.**

------------------------------------------------------------------------

# Running Locally

## Prerequisites

Install:

-   Node.js
-   PostgreSQL
-   Redis
-   Git

Docker can also be used for PostgreSQL and Redis.

## 1. Clone the Repository

``` bash
git clone https://github.com/Akash-Sahani18/Shortify.git
cd Shortify
```

## 2. Configure PostgreSQL

Create a PostgreSQL database and execute:

``` text
backend/db/schema.sql
```

Configure the database connection in:

``` text
backend/.env
```

## 3. Configure Redis

Start Redis locally and configure:

``` env
REDIS_URL=redis://127.0.0.1:6379
```

## 4. Configure Backend

``` bash
cd backend
npm install
```

Create:

``` text
backend/.env
```

using:

``` text
backend/.env.example
```

Start the backend:

``` bash
npm start
```

The backend runs on:

``` text
http://localhost:3000
```

## 5. Configure Frontend

Open another terminal:

``` bash
cd frontend
npm install
```

Create:

``` text
frontend/.env
```

using:

``` text
frontend/.env.example
```

Start the frontend:

``` bash
npm run dev
```

The frontend normally runs on:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# API Overview

Major API operations include:

``` text
POST   /api/register
POST   /api/login

POST   /api/short
GET    /api/analytics
GET    /api/analytics/:id
POST   /api/short/:id/disable
GET    /api/short/:id/qr

POST   /api/forgot-password
POST   /api/reset-password
```

The redirect endpoint handles shortened URLs directly.

------------------------------------------------------------------------

# Docker

Shortify is fully containerized with Docker Compose so the frontend,
backend, PostgreSQL database, and Redis cache can run together.

## Docker Architecture

``` text
                         ┌──────────────────────┐
                         │        Browser       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Frontend Container  │
                         │   React + Nginx :80  │
                         └──────────┬───────────┘
                                    │
                              REST API / HTTP
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Backend Container   │
                         │ Node + Express :3000 │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                ┌──────────────────┐  ┌──────────────────┐
                │ PostgreSQL       │  │ Redis            │
                │ Container :5432  │  │ Container :6379  │
                └────────┬─────────┘  └──────────────────┘
                         │
                         ▼
                  postgres_data
                     volume
```

## Docker Services

  -----------------------------------------------------------------------
  Service                 Image                   Purpose
  ----------------------- ----------------------- -----------------------
  `frontend`              `nginx:alpine`          Serves the React
                                                  production build

  `backend`               `node:22-alpine`        Runs the Express API

  `postgres`              `postgres:18`           Persistent application
                                                  database

  `redis`                 `redis:7-alpine`        Redirect cache, OTP
                                                  storage, and rate
                                                  limiting
  -----------------------------------------------------------------------

## Docker Files

``` text
Shortify/
│
├── docker-compose.yml
│
├── backend/
│   └── Dockerfile
│
└── frontend/
    ├── Dockerfile
    └── nginx.conf
```

### Backend Dockerfile

The backend image installs production dependencies and runs the Express
server on port `3000`.

### Frontend Dockerfile

The frontend uses a multi-stage build:

``` text
React source
     │
     ▼
Node build stage
     │
     ▼
npm run build
     │
     ▼
React dist/
     │
     ▼
Nginx runtime image
```

This keeps the final frontend container focused on serving the
production build.

### Nginx

Nginx serves the React application and uses SPA fallback routing so
paths such as `/analytics`, `/guardian`, and `/login` can be loaded
directly.

------------------------------------------------------------------------

## Run Shortify with Docker

### Prerequisites

Install:

-   Docker Desktop
-   Git

Verify:

``` bash
docker --version
docker compose version
```

### 1. Clone the Repository

``` bash
git clone https://github.com/Akash-Sahani18/Shortify.git
cd Shortify
```

### 2. Configure Backend Secrets

The repository does not contain real credentials.

Use:

``` text
backend/.env.example
```

Provide the required runtime values through your Docker Compose
environment, including:

``` env
JWT_SECRET=your_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email
```

Do not commit real credentials.

### 3. Build and Start

From the project root:

``` bash
docker compose up -d --build
```

Check the containers:

``` bash
docker compose ps
```

Expected services:

``` text
shortify-frontend
shortify-backend
shortify-postgres
shortify-redis
```

### 4. Open the Application

Frontend:

``` text
http://localhost:5173
```

Backend:

``` text
http://localhost:3000
```

PostgreSQL and Redis are accessed by the backend through the internal
Docker Compose network.

### 5. View Logs

All services:

``` bash
docker compose logs
```

Backend:

``` bash
docker compose logs backend
```

Follow backend logs:

``` bash
docker compose logs -f backend
```

### 6. Stop the Application

``` bash
docker compose down
```

To remove containers and the PostgreSQL volume:

``` bash
docker compose down -v
```

> `docker compose down -v` removes the local PostgreSQL data stored in
> the Docker volume.

------------------------------------------------------------------------

## Docker Startup Flow

``` text
docker compose up
        │
        ▼
┌─────────────────────┐
│ PostgreSQL starts   │
│ health check        │
└──────────┬──────────┘
           │
           │ healthy
           ▼
┌─────────────────────┐
│ Backend starts      │
│ Node + Express      │
└──────────┬──────────┘
           │
           ├──────────────► Redis
           │
           ▼
┌─────────────────────┐
│ Frontend starts     │
│ React + Nginx        │
└─────────────────────┘
```

The PostgreSQL health check is used so the backend waits for the
database to become ready before starting.

------------------------------------------------------------------------

## Docker Environment

Inside Docker, the backend communicates with services using their
Compose service names rather than `localhost`.

``` env
DATABASE_URL=postgresql://shortify:shortify_dev_password@postgres:5432/shortify
REDIS_URL=redis://redis:6379
```

The frontend build uses:

``` env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_BASE_URL=http://localhost:3000
```

These values are intended for the local Docker setup.

------------------------------------------------------------------------

## Docker Development Flow

``` text
Developer
    │
    ▼
docker compose up -d --build
    │
    ├── PostgreSQL
    │      └── schema.sql
    │
    ├── Redis
    │
    ├── Backend
    │      └── Node + Express
    │
    └── Frontend
           └── React build + Nginx
```

Docker makes the local application environment reproducible without
requiring PostgreSQL and Redis to be installed directly on the host
machine.

# Engineering Decisions

## PostgreSQL

PostgreSQL is used as the primary database because the application
contains relational entities and ownership relationships between users,
URLs, and clicks.

## Redis

Redis provides fast access to frequently requested redirect data and
temporary application state such as password-reset information and
rate-limit counters.

## JWT

JWT provides stateless authentication between the frontend and backend.

## Cache Validation

Cached links are not blindly redirected.

The backend validates link status and expiration before redirecting.
This prevents stale Redis entries from allowing disabled or expired
links to remain active.

## Ownership Checks

User-specific operations verify ownership before allowing access to link
data or management operations.

------------------------------------------------------------------------

# Development Focus

Shortify was built to explore practical full-stack and backend
engineering concepts including:

-   REST API development
-   Authentication and authorization
-   Database design
-   Redis caching
-   Cache invalidation
-   Analytics
-   Secure password recovery
-   Rate limiting
-   API security
-   Frontend state management
-   Environment configuration
-   Cloud deployment

------------------------------------------------------------------------

# Future Improvements

Potential improvements include:

-   Custom short aliases
-   Advanced time-based analytics
-   Geographic analytics
-   Improved abuse and spam detection
-   Automated test coverage
-   CI/CD pipelines
-   Application monitoring
-   Structured logging
-   Horizontal backend scaling
-   More advanced link permissions

------------------------------------------------------------------------

# Project Status

Shortify is an actively developed full-stack project.

Current core functionality includes:

-   URL shortening
-   Authentication
-   Link management
-   Analytics
-   QR code generation
-   Link expiration
-   Link disabling
-   Guardian
-   Password reset
-   PostgreSQL persistence
-   Redis caching
-   API rate limiting
-   Security middleware

------------------------------------------------------------------------

## 👨‍💻 Author
*Akash Sahani*  
📫 [GitHub](https://github.com/Akash-Sahani18) | [LinkedIn](https://www.linkedin.com/in/akash-sahani-440147243)
