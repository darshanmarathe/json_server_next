# JSON Server Next 


1. JSON Server Next is a stand alone server inspired by JSON-Server 
2. Support Many Databases 
3. Every Feature is Mostly done with Middleware from Express
4. Ones AI updates the code add the summery in the # ChangeLog



# ChangeLog

- 2026-04-12: Added heavy runtime function tracing (`TRACE` logs) with auto-wrapping of controllers/repos/middlewares/cache/admin methods, ENTER/EXIT timing logs, summarized args, Express error stack logging, and process-level `uncaughtException`/`unhandledRejection` call stack output.
- 2026-04-12: Replaced underscore-style utility usage in query/paging code with native JS helpers (`getByPath`, `Array.slice`) and removed direct `lodash` dependency from project manifests.
- 2026-04-12: Improved Docker packaging with lean production dependency install (`npm ci --omit=dev`), corrected container port to `4000`, non-root writable `data/admin_data` setup, healthcheck, persistent volumes, and new `.dockerignore` to reduce build context.
- 2026-04-12: Fixed SQLite `Create`/`Update` body handling so missing or invalid bodies no longer crash, `Create` now always persists with generated GUID `_id` and auto `_createdOn`, and `Update` safely normalizes input with `_updatedOn`.
- 2026-04-09: Added API `PATCH /rest/:type/:id` capability with partial-update merge in main controller, middleware pipeline hooks (`rev-proxy`, `webhooks`, `realtime`), default collection schema support for PATCH endpoints, and hypermedia/readme updates.
- 2026-04-09: Added advanced list query support on `GET /rest/:type/` for condition filters (`field:op=value` such as `views:gt=100`), sort (`_sort=-field`), pagination alias (`_page` + `_per_page`), embedding (`_embed=collection` using `<parent>Id` links), and complex JSON `_where` expressions with `and`/`or`/`not`.
- 2026-04-09: Added SQL pushdown path (`GetDataWithQuery`) for `postgres` and `sql` providers so supported filters/sort/pagination/_where are executed in database queries, with automatic in-memory fallback for unsupported query fragments (including `_embed`).
- 2026-04-09: Added MongoDB pushdown path (`GetDataWithQuery`) so supported filters/sort/pagination/_where are executed in `find/sort/skip/limit`, with automatic in-memory fallback for unsupported query fragments (including `_embed`).
- 2026-04-09: Added SQLite provider support (`PROVIDER=sqlite`) with a new `repos/sqlite.js` adapter and SQL pushdown support for filters/sort/pagination/_where using SQLite JSON functions.
