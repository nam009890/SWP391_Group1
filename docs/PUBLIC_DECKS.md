# Public Decks, My Decks and ownership

## Behavior

- `/` lists real public, non-deleted decks. Search (name/description), sort and pagination execute on the server.
- `/my-decks` requires a validated session and only lists decks owned by the current principal.
- New decks default to PRIVATE. The server obtains their owner from JWT, ignoring client owner IDs.
- Legacy decks retain IDs and cards, remain PUBLIC with no owner, and are read-only.
- Owner can edit, publish/unpublish, add cards, generate AI cards, and soft-delete decks. Existing flashcard edit/delete operations were not present and are not introduced.
- Guest study fetches public flashcards and uses React state only. It never calls review or weak-vocabulary writes.
- Authenticated study preserves the existing SM-2 scheduling and automatic weak detection for each learner.
- Saved weak words, practice snapshots, and answer distractors cannot expose a deck that becomes private/deleted.
- A 403 does not log out the user. A protected 401 expires the client session. `/api/auth/me` validates persisted tokens on refresh.

## SQL Server migration

Use `db/migrations/20261024_deck_ownership.sql` on the existing database. Do **not** run `db/database.sql`: it is the original destructive clean-install script.

With Windows authentication, from repository root:

```powershell
sqlcmd -S tcp:localhost,1433 -E -d demo_db -b -i db/migrations/20261024_deck_ownership.sql
```

The migration is additive and repeatable. It adds nullable owner/FK, visibility, timestamps, soft delete, check constraint and indexes. Existing rows get PUBLIC; no user is assigned to legacy decks. It contains no DROP or DELETE.

Record counts and IDs before/after for `decks`, `flashcards`, `user_flashcard_reviews`, `user_weak_vocabularies`, `weak_practice_sessions`. On the development SQL Server, migration preserved 4 decks, 86 cards, 0 reviews, 80 weak records and 0 sessions. All four legacy deck IDs remained 1–4, PUBLIC, owner NULL, deleted 0. The script was run twice successfully.

Hibernate `ddl-auto=update` remains supported, but run the migration first to install constraints and indexes reliably. SQL Server cannot always compile references to newly added columns in the same batch, so follow-up statements use dynamic SQL.

## API

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| GET | `/api/decks/public` | Guest | Paginated public decks |
| GET | `/api/decks/public/{id}` | Guest | Public deck details |
| GET | `/api/decks/public/{id}/flashcards` | Guest | Public flashcards |
| GET | `/api/decks/my` | JWT | Current user's public/private decks |
| GET | `/api/decks` | JWT | Compatible visible-deck picker for weak filters |
| GET | `/api/decks/{id}` | JWT, public or owner | Deck details |
| GET | `/api/decks/{id}/flashcards` | JWT, public or owner | Flashcards |
| POST | `/api/decks` | JWT | Create owned deck |
| PUT | `/api/decks/{id}` | Owner | Update name, description, visibility |
| PATCH | `/api/decks/{id}/visibility` | Owner | Publish/unpublish |
| DELETE | `/api/decks/{id}` | Owner | Soft delete |
| POST | `/api/decks/{id}/flashcards` | Owner | Add flashcard |
| POST | `/api/decks/{id}/generate-ai` | Owner | Generate AI cards |
| GET | `/api/study/decks/{id}/due` | JWT, public or owner | Personal due cards |
| POST | `/api/study/flashcards/{id}/review` | JWT, public or owner | Save personal review |
| GET | `/api/auth/me` | Valid JWT | Current user, no secrets |

Public/my list parameters: `keyword`, `sort`, `page` (zero-based), `size` (1–48). My list additionally accepts `visibility=PUBLIC|PRIVATE`. Sort values: `NEWEST`, `OLDEST`, `NAME_ASC`, `NAME_DESC`, `MOST_FLASHCARDS`. Responses: `content`, `number`, `size`, `totalElements`, `totalPages`, `first`, `last`.

Create/update body: `{ "name": "Travel", "description": "Useful words", "visibility": "PRIVATE" }`.
Visibility body: `{ "visibility": "PUBLIC" }`.
Name: 1–255 nonblank characters; description: at most 5000 characters. Unknown enum values and invalid input return 400. Missing authentication returns 401; visible non-owned mutation returns 403; missing/hidden/deleted deck returns 404. No private metadata is included in hidden-deck errors.

## Verification

```powershell
cd spring-boot-app
mvn clean test
mvn clean compile
cd ../frontend
npm run build
npm run lint
```

`DeckSecurityIntegrationTest` uses H2 in SQL Server compatibility mode, real JWT/filter chain, repositories and MockMvc; no production data is written by these tests. Regression tests cover authentication password checks, Grammar, Study, Weak Vocabulary and Weak Practice. Google OAuth and AI provider calls require live external services; ownership rejection is tested without calling AI.

Verified on 2026-10-24: `mvn clean test` passed 66 tests (20 new deck security integration tests), with no failures/errors/skips. Frontend production build passed; ESLint reported 0 errors and 41 existing warnings. Live SQL Server startup succeeded. Public list, all five sorts, search with trimmed/case-insensitive keyword, pagination, public cards and Guest 401 for My Deck were verified on SQL Server. Browser checks verified Guest search, deck details without edit controls, card flip, Next/Previous, finish/restart, and redirect from My Deck to Login. Guest study did not create review or weak records.

The seeded demo account was also used to verify Login returning to My Deck, the empty owned list, Create Deck defaulting to PRIVATE, owner-only management controls, editing description, adding a flashcard and Logout continuing to read a published deck. A temporary QA deck (ID 5) was published/unpublished through the live API: Guest reads changed from 200 to 404 while owner reads remained 200. Browser refresh after unpublish showed no deck content. The QA deck was then soft-deleted (204), leaving public count 4 and My Deck count 0. Its one test card is intentionally retained under the soft-deleted deck; no original records were removed. Original IDs 1–4 still contain 86 cards; reviews remain 0 and weak records remain 80.

Startup verification also identified a SQL Server incompatibility in pre-existing Grammar text column definitions (`LONGTEXT`), corrected to `NVARCHAR(MAX)`, and a JDK 25/IDE-generated constructor error. Changed services use explicit constructor injection to avoid that constructor-generation problem. Google OAuth consent and successful external AI generation were not exercised; those provider flows remain dependent on valid external configuration.

## Manual test: Guest / User A / User B

1. Guest: open `/`, search by name/description and try all sorts. Open a public deck, flip cards, previous/next, finish and restart. No Add Card/AI/weak buttons should appear. Reviews/weak counts must stay unchanged.
2. Guest: open `/my-decks` or weak practice directly. Login must be requested and return to the requested route. Refresh public deck URLs and confirm they still work.
3. User A: create a deck without selecting visibility. It must be PRIVATE and present only in A's My Decks. Add a card; edit name/description; refresh.
4. User B/Guest: open A's private deck by URL and via public, authenticated cards, study and weak APIs. Expect 404 without deck metadata.
5. User A: publish. User B/Guest must find it on Explore. User B can study/save review/mark weak vocabulary; no editing controls appear. Forged write requests must fail.
6. User A: unpublish. B loses access via direct deck URL, saved weak list and existing practice session; A retains access. Learning records remain in the database.
7. User A: soft-delete an owned deck. It disappears from both lists; cards and review history remain. Legacy decks cannot be edited or claimed.
8. Test expired/invalid JWT, 403, backend unavailable and retry. A 403 must not clear a valid session. Logout must allow continuing to browse public decks.

## Main changed files

- Domain/data: `Deck`, `DeckVisibility`, `DeckRepository`, `FlashcardRepository`, migration and clean-install schema.
- API/authorization: `DeckAccessPolicy`, `DeckService[Impl]`, `FlashcardController`, `FlashcardServiceImpl`, `DeckPage`, `DeckRequest`, `DeckResponse`.
- Integration: `StudyServiceImpl`, `WeakVocabularyServiceImpl`, `WeakPracticeServiceImpl`, `AuthController`, `SecurityConfig`, `JwtAuthenticationFilter`, global error handler.
- UI: `DeckExplorer.jsx/css`, `deckApi.js`, `ProtectedRoute`, `App`, `Navbar`, `CreateDeckModal`, `DeckDetails`, `StudyMode`, `Login`, Axios configuration.
- Tests: new deck security integration suite and updated regression fixtures for public decks.
- SQL Server compatibility: GrammarQuestion text columns use NVARCHAR(MAX), matching SQL Server schema; no Grammar business rules changed.

Development defaults remain frontend 5173 and backend 8080. Optional `VITE_API_URL` selects another API origin; `app.cors.allowed-origins` configures the exact permitted frontend origins.
