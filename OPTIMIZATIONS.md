Database Optimizations performed (2025-09-06)

Summary
- Limited select columns on hot paths (auth, listings) to avoid fetching large JSON fields.
- Converted several .find() calls that eagerly load relations to query builders selecting only summary fields and paginating.
- Added short-term caching for expensive aggregation endpoints and leaderboard queries.
- Added a SQL migration file `migrations/20250906_add_indexes.sql` with recommended indexes.
- Added a simple benchmark script: `scripts/bench-db.ts` to measure timings locally.

How to run the bench script

1. Set environment variables for your DB connection in PowerShell (example):

$env:DATABASE_URL = 'postgres://user:pass@localhost:5432/dbname'
$env:BENCH_EMAIL = 'existing@example.com'
$env:BENCH_USER_ID = '00000000-0000-0000-0000-000000000000'

2. Run the script (requires ts-node):

npx ts-node scripts/bench-db.ts

Notes and rationale
- Selecting only the columns needed for authentication (id, email, password) avoids loading large `jsonb` columns like `metadata` or `emailPreferences`.
- Pagination and explicit selects reduce memory pressure and avoid N+1 relation fetches for list endpoints.
- Caching aggregation results for short TTLs (30-60s) gives large improvements for repeated admin dashboard queries while keeping freshness acceptable.
- Indexes in `migrations/20250906_add_indexes.sql` are recommended for the reported slow endpoints — run them in staging first.

Next steps
- Run the benchmark before/after applying migration and caching to measure the >=30% improvement.
- If further slow queries persist, enable slow query logging on Postgres and collect the EXPLAIN ANALYZE plans for the slow statements and iterate.
- Consider adding TypeORM migrations to manage the index creation programmatically.
