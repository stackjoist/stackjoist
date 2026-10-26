# Mongoose / MongoDB reference

- MongoDB has no migrations by default: schema changes apply to new writes only. Plan how existing documents are handled (defaults on read, a backfill script, or a versioned field).
- Declare indexes in the schema and check them with `explain()` on realistic data. Building a large index on a busy collection needs planning.
- Validate ids before querying (`/^[a-f\d]{24}$/i` for ObjectIds) so malformed input returns 400, not a cast error.
- Use `.lean()` for read-only queries, projections to limit fields, and always bound lists with `limit`.
- Use `runValidators: true` on update queries; schema validators do not run on updates by default.
- Never build queries from raw user objects (operator injection such as `{ "$gt": "" }`). Validate input shapes first and enable `strictQuery`.
- Tests should use a disposable database, such as `mongodb-memory-server`, never the `MONGODB_URI` of a shared environment.
