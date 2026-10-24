# SWP391_Group1

## Public Decks and My Decks

Guest can explore public decks and study without saving progress. Signed-in learners manage owned decks at `/my-decks`, publish/unpublish them, and keep personal learning history. Private decks and all writes are enforced by backend ownership checks.

See [implementation, migration, API and test guide](docs/PUBLIC_DECKS.md).

Existing databases: run only `db/migrations/20261024_deck_ownership.sql`. **Do not run `db/database.sql` on existing data**; that file resets the database.
