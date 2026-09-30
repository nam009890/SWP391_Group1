# StudyE development database

Engine: Microsoft SQL Server. Run `db/database.sql` in SQL Server Management Studio.

The script creates `demo_db` when needed, then **drops and recreates every application table** before inserting deterministic development data. It is safe to rerun for local development, but must never be run against production.

Hibernate remains configured with `spring.jpa.hibernate.ddl-auto=update`; this script is the shared development reset source.

Demo account (development only): `demo@studye.local` / `password`.

Expected seed: 1 user, 4 decks, 86 flashcards, and 70 active weak-vocabulary records. Practice tables start empty.
