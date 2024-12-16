# Graham SDR

An AI-powered SDR automation platform with lead detection, email outreach, and analytics.

## Features

- 🤖 AI-powered lead detection and enrichment
- 📧 Automated email outreach with A/B testing
- 📊 Advanced analytics and reporting
- 👥 Team collaboration features
- 🔄 CRM and calendar integrations
- 🔍 LinkedIn integration for lead research
- 📈 Custom sequences and campaigns
- 🎯 Lead scoring and prioritization

## Tech Stack

- Backend: Node.js with Fastify
- Frontend: Next.js 14 with App Router
- Database: PostgreSQL with Prisma ORM
- Authentication: Clerk
- UI: shadcn/ui components
- Analytics: Recharts
- Email: Resend
- AI: OpenAI

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Yarn 4+

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/graham"
DIRECT_URL="postgresql://user:password@localhost:5432/graham"

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Email
RESEND_API_KEY=your_resend_api_key

# AI
OPENAI_API_KEY=your_openai_api_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Development Setup

1. Install dependencies:
```bash
yarn install
```

2. Set up the database:
```bash
cd packages/db
yarn prisma generate
yarn prisma db push
```

3. Start the development server:
```bash
# Start the backend server
cd packages/server
yarn dev

# In a new terminal, start the frontend
cd packages/next
yarn dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
packages/
  ├── db/                 # Database schema and Prisma client
  ├── server/            # Backend API server
  │   ├── src/
  │   │   ├── routes/    # API routes
  │   │   ├── services/  # Business logic
  │   │   ├── utils/     # Utilities
  │   │   └── workers/   # Background jobs
  │   └── package.json
  └── next/              # Frontend Next.js app
      ├── src/
      │   ├── app/       # App router pages
      │   ├── components/# UI components
      │   └── lib/       # Utilities and API client
      └── package.json
```

## Available Scripts

In each package:

```bash
# Development
yarn dev

# Type checking
yarn type:check

# Building
yarn build

# Production
yarn start
```