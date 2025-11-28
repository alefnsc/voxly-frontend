# Voxly AI Mock Interview - Setup Guide

## Architecture Overview

This application uses **Clerk for authentication** with a **serverless-first approach**. User roles and credits are managed entirely through Clerk's metadata system, **eliminating the need for backend API calls** for authentication logic.

### Key Features
- ✅ **Direct Clerk Integration** - Roles read from `publicMetadata`
- ✅ **No Auth Backend Required** - Client-side role checking
- ✅ **Automatic Credit Management** - Stored in `unsafeMetadata`
- ✅ **Optional Backend** - Only needed for interview/feedback services

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account (for authentication)

## Environment Setup

### Frontend (.env)

Create a `.env` file in `ai-mock-interview-front/`:

```env
BASE_URL_DEVELOPMENT=http://localhost:3000/
REACT_APP_BACKEND_URL=http://localhost:3001

# Clerk Configuration
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Retell API (for voice interviews)
REACT_APP_RETELL_API_KEY=YOUR_RETELL_API_KEY
```

### Backend (.env)

Create a `.env` file in `ai-mock-interview-back/`:

```env
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Server Configuration
PORT=3001
NODE_ENV=development

# API Security
API_KEY=voxly_ai_security
```

## Getting Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Navigate to "API Keys"
4. Copy the **Publishable Key** (starts with `pk_test_` for test or `pk_live_` for production)
5. Copy the **Secret Key** (starts with `sk_test_` for test or `sk_live_` for production)

## Clerk User Metadata Configuration

### Setting User Roles

Users need the `ProgramadorSemPatria` role to access the application. The frontend reads this **directly from Clerk's publicMetadata** (no backend API needed).

#### Method 1: Clerk Dashboard (Recommended)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select user
3. Scroll to **Public Metadata** section
4. Add:
```json
{
  "role": ["ProgramadorSemPatria"]
}
```

#### Method 2: Programmatically (if using backend)
```javascript
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    role: ["ProgramadorSemPatria"]
  }
});
```

### Credit System

Credits are automatically managed in `unsafeMetadata`:
- **Initial Credits**: 2 per month
- **Auto-Reset**: First day of each month
- **Client-Side Updates**: No backend API needed
- **Storage**: `{ credits: 2, year: 2025, month: 11 }`

The application automatically:
1. Checks if user has PSP role (from `publicMetadata`)
2. Assigns credits if role is present
3. Resets credits monthly
4. Updates credits after each interview

## Installation

### Install Frontend Dependencies

```bash
cd ai-mock-interview-front
npm install
```

### Install Backend Dependencies

```bash
cd ai-mock-interview-back
npm install
```

## Running the Application

### Start Backend Server

```bash
cd ai-mock-interview-back
npm run dev
```

The server will run on `http://localhost:3001`

### Start Frontend Application

```bash
cd ai-mock-interview-front
npm start
```

The app will run on `http://localhost:3000`

## Database (Optional)

A PostgreSQL database is available via Docker Compose but **not currently used**. The application stores all user data in Clerk's metadata.

To start PostgreSQL (for future features):

```bash
docker-compose up -d
```

Access:
- **PostgreSQL**: localhost:5432
- **PgAdmin**: http://localhost:5050
  - Email: admin@voxly.com
  - Password: admin

Database Credentials:
- User: voxly_user
- Password: voxly_password
- Database: voxly_db

## API Endpoints

### Backend API (Optional)

The backend is **optional** and only needed for interview/feedback services:

**Still Used:**
- `POST /register-call` - Register new interview call with Retell
- `GET /get-call/:call_id` - Get interview call details
- `GET /get-feedback-for-interview/:call_id` - Get AI feedback

**No Longer Needed (Replaced by Clerk):**
- ~~`GET /get-user-info/:userId`~~ - **Now using Clerk's publicMetadata**
- ~~`POST /update-credits`~~ - **Now using Clerk's unsafeMetadata**

### Authentication Flow

1. User signs in via Clerk
2. **Frontend reads role directly from `user.publicMetadata.role`** (no backend call)
3. If user has `ProgramadorSemPatria` role, grant access
4. Credits managed client-side in Clerk's `unsafeMetadata`
5. Credits automatically reset monthly

## Testing

### Frontend Tests

```bash
cd ai-mock-interview-front
npm test
```

### E2E Tests (Cypress)

```bash
cd ai-mock-interview-front
npm run cypress:open
```

## Troubleshooting

### Clerk Authentication Not Working

1. Verify your Clerk keys are correct in `.env`
2. Make sure you're using the correct key type (test vs live)
3. Check that CORS is enabled for `http://localhost:3000`

### Role Check Failing

1. Ensure user has `ProgramadorSemPatria` in **Public Metadata** (not unsafe metadata)
2. Check browser console for role check logs:
   ```
   🔍 Checking roles from publicMetadata: ["ProgramadorSemPatria"]
   ✅ User has PSP role
   ```
3. Verify in Clerk Dashboard: Users → Select User → Public Metadata
4. Role must be in `publicMetadata.role` array
3. Verify backend URL is correct in frontend `.env`

### Credits Not Updating

1. Credits are stored in Clerk's `unsafeMetadata`
2. They auto-reset at the start of each month
3. Check browser console for credit update errors

## Architecture Decisions

### Why No Database?

- **Clerk handles all user data** via metadata
- **Simpler architecture** - no database migrations or ORM
- **Scalability** - Clerk's infrastructure handles scale
- **Security** - Clerk manages authentication & data security

### When to Add a Database?

Consider PostgreSQL when you need:
- Complex data relationships
- Interview history/analytics
- Large amounts of user-generated content
- Advanced querying capabilities

## Deployment

### Frontend (Vercel/Netlify)

1. Connect your GitHub repo
2. Set environment variables
3. Deploy

### Backend (Heroku/Railway/Render)

1. Push to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

## Security Notes

- Never commit `.env` files
- Use different Clerk keys for dev/prod
- API key should be regenerated for production
- Enable rate limiting in production
- Use HTTPS in production

## Support

For issues or questions, contact the development team or check the documentation.
