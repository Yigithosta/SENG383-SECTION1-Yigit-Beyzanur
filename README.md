
# SENG383-SECTION1-G4

**AI-Assisted Child Development Platform**

SENG 383 – Software Project III Term Project (Fall 2026)

A web-based decision support platform where parents and specialists share schedules, tasks, and observation records. AI-generated summaries support decision-making but do not provide diagnoses or treatment recommendations.

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: SQLite
- Testing: Jest, Supertest, Vitest, Playwright
- CI: GitHub Actions

## Prerequisites

Install the following software:

- Node.js 22.9.0 or later
- npm
- Git

Verify the installation:

```bash
node --version
npm --version
git --version
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Yigithosta/SENG383-SECTION1-Yigit-Beyzanur.git
cd SENG383-SECTION1-Yigit-Beyzanur
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

The backend can start without a `.env` file. To customize its configuration, copy the example file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend HTTP server port | `3001` |
| `DB_FILE` | SQLite database file path | `backend/data/app.sqlite` |
| `JWT_SECRET` | Secret used to sign authentication tokens | Random temporary secret |

If `JWT_SECRET` is not configured, the backend creates a temporary secret on startup. Login sessions will not survive a server restart.

Generate a permanent secret using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env` files or real credentials.

### 4. Seed the Demo Database

From the `backend` directory:

```bash
npm run seed
```

This creates the database schema and inserts synthetic demo accounts.

**Warning:** Seeding deletes existing demo-related records from the `child_specialists`, `children`, and `users` tables. Do not run it against a database containing information you want to preserve.

### 5. Start the Backend

From the `backend` directory:

```bash
npm run dev
```

The backend runs at:

http://localhost:3001

Check its health endpoint:

http://localhost:3001/api/health

Expected response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

Keep this terminal running.

### 6. Start the Frontend

**Open a second terminal** while the backend continues running.

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the application:

http://localhost:5173

**Important:** The backend and frontend must run at the same time. Vite forwards frontend `/api` requests to the backend on port `3001`.

### 7. Log In

Use one of the demo accounts below.

## Demo Accounts

All demo accounts use the password `Demo1234!`.

| Role | Email | Password | Notes |
|---|---|---|---|
| Parent | `parent@demo.test` | `Demo1234!` | Parent account |
| Child | `child@demo.test` | `Demo1234!` | Child account |
| Teacher | `teacher@demo.test` | `Demo1234!` | Linked specialist |
| Psychologist | `psychologist@demo.test` | `Demo1234!` | Linked specialist |
| Doctor | `doctor@demo.test` | `Demo1234!` | Unlinked specialist (bağlı olmayan uzman) |

These accounts contain synthetic data for development and demonstration only.

## Running Tests

### Backend Tests

From the repository root:

```bash
cd backend
npm install
npm test
```

Backend tests use Jest and Supertest.

### Frontend Tests

From the repository root:

```bash
cd frontend
npm install
npm test
```

Frontend tests use Vitest.

### End-to-End Tests

From the repository root:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ../e2e
npm install
npx playwright install chromium
npm run test:e2e
```

Playwright runs three login tests in Chromium:

1. Successful parent login.
2. Incorrect password handling.
3. Child login and role-based navigation.

The E2E runner automatically creates a temporary SQLite database, seeds demo users, and starts both servers.

**Note:** E2E tests require the SCRUM-38 Playwright implementation.

## Continuous Integration

GitHub Actions runs automated checks for pull requests targeting `main`.

The CI workflow installs project dependencies, runs the configured tests, and builds the frontend.

The Playwright E2E workflow also installs Chromium and uploads a Playwright HTML report if its tests fail.

## Development Notes

- Use synthetic data only for development and testing.
- Never commit `.env` files, credentials, or private information.
- Keep changes in feature branches and submit them through pull requests.
- Follow the project's Jira task and GitHub workflow conventions.
