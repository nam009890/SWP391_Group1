# EVMS

English Vocabulary Management System

## Tech Stack

Backend:

- Java 17
- Spring Boot
- Maven

Frontend:

- React
- Vite
- JavaScript

Database:

- PostgreSQL

Database Migration:

- Flyway

## Project Structure

backend/
frontend/

## Requirements

- JDK 17 or newer JDK capable of compiling target Java 17
- Node.js
- npm

## Database Setup

Environment variables:

- `DB_URL=jdbc:postgresql://localhost:5432/evms`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=<your-local-password>`

1. Install PostgreSQL.
2. Create an empty database named `evms`.
3. Configure the database credentials.
4. Start Spring Boot; Flyway applies migrations automatically.

## Frontend Environment

`.env.example` is a template. Optionally copy it to `frontend/.env.local` and set
`VITE_DEMO_USER_ID` to the ID of `demo@evms.local` in your local database. The
development defaults still work without this file.

To find the demo user ID after loading demo data:

```sql
SELECT id, email FROM users WHERE LOWER(email) = LOWER('demo@evms.local');
```

## Run Backend

Windows:

```powershell
cd backend
.\mvnw spring-boot:run
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```
