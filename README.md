# SENG383-SECTION1-G4

AI-Assisted Child Development Platform
SENG 383 – Software Project III Term Project (Fall 2026)
A web-based decision support platform where parents and specialists share a schedule, task list, and observation records. An AI component summarizes records for each role. It supports decision-making but does not make decisions, diagnoses, or treatment recommendations.

Tech Stack
- Frontend: React (Vite) – planned
- Backend: Node.js, Express
- Database: SQLite
- Testing: Jest, Supertest

Prerequisites
Before running the backend, install:
- Node.js version 22.9.0 or later
- npm (included with Node.js)
- Git

Check your installed versions:
node --version
npm --version

Getting Started
1. Clone the repository
git clone https://github.com/Yigithosta/SENG383-SECTION1-Yigit-Beyzanur.git
cd SENG383-SECTION1-Yigit-Beyzanur

2. Configure environment variables
Move into the backend directory:
cd backend
Copy the example environment file to .env if you want to customize the settings.
macOS / Linux
cp .env.example .env

Windows PowerShell
Copy-Item .env.example .env

Available environment variables:
VariableDescriptionDefaultPORTBackend server port3001DB_FILESQLite database file pathbackend/data/app.sqlite
If DB_FILE is empty or not provided, the application uses its default database location.
Important: Never commit your .env file or real credentials to the repository.

3. Install backend dependencies
From the backend directory, run:
npm install

4. Run the tests
npm test
This runs the backend test suite using Jest.

5. Seed the database
npm run seed
This command creates the database schema if necessary and inserts synthetic demo data.
Warning: Running the seed script deletes existing records from the child_specialists, children, and users tables before inserting the demo data. Do not run it against a database containing data you want to keep.

6. Start the backend server
For development, run:
npm run dev
To start the server without watch mode, use:
npm start
The backend runs on port 3001 by default.

7. Check the API health
With the backend running, open:
http://localhost:3001/api/health
A successful response should indicate that the API and database are available:
{
  "status": "ok",
  "database": "ok"
}

Demo Accounts
The seed script creates the following synthetic demo accounts. All accounts use the same password:
Password: Demo1234!

Role Email Relationship:
Parent    parent@demo.test        Parent account

Child    child@demo.test    Child account

Teacher    teacher@demo.test     Linked specialist

Psychologist    psychologist@demo.test    Linked specialist

Doctor      doctor@demo.test       Registered but not linked

Available Backend Commands

Run these commands from the backend directory.

npm install            Installs backend dependencies

npm test               Runs backend tests

npm run seed           Inserts synthetic demo data

npm run dev            Starts the development server with watch mode

npm start              Starts the backend server


SENG383-SECTION1-Yigit-Beyzanur/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js
│   │   │   ├── schema.sql
│   │   │   └── seed.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── health.test.js
│   │   └── seed.test.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── docs/
│   └── PMP.md
├── .gitignore
└── README.md
Development Notes
- Use synthetic data only for development and testing.
- Do not commit .env files, credentials, or private data.
- Keep changes in feature branches and submit them through pull requests.
- Follow the project's Jira task and GitHub workflow conventions.
 
