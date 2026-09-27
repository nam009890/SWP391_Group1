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
