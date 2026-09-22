# KWE Quote Service

Backend for the Instant Quote application. Stage 1 provides a liveness endpoint
and a code lookup endpoint. Rate lookup, quote generation and quote request
persistence are not built yet.

## Requirements

- JDK 21 or newer. The build targets Java 21 bytecode.
- Docker, for the Testcontainers based tests.
- No global Maven install is needed. Use the bundled `./mvnw`.

## Configuration

The service reads its database settings from the environment. Nothing is
committed. Copy `.env.example` for the list of names.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DB_HOST` | yes | none | Database host name |
| `DB_PORT` | no | `5432` | Database port |
| `DB_NAME` | yes | none | Database name, for example `quoteamdev` |
| `DB_SCHEMA` | no | `quoteownr` | Schema holding the tables |
| `DB_USER` | yes | none | Database user |
| `DB_PASSWORD` | yes | none | Database password |
| `SERVER_PORT` | no | `8080` | HTTP port |

The service fails to start when a required variable is missing. That is
intended. Failing at startup is better than failing on the first request.

Note that the database name and the schema name are different. `quoteamdev` is
the database. `quoteownr` is the schema inside it.

## Running

```bash
export JAVA_HOME=/path/to/jdk
export DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=...
./mvnw spring-boot:run
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ping` | Liveness. Does not touch the database |
| GET | `/api/v1/codedetails` | Code categories and their values |

## Tests

The test sources under `src/test` are intentionally not version controlled;
this was an explicit decision by the repository owner. A fresh clone of this
repository therefore contains no tests at all. Running `./mvnw test` on a
fresh clone will report success because there is nothing to run, not because
anything was verified. Do not take a passing `./mvnw test` on a fresh clone as
evidence the service works.

If you have the test sources (for example because you are working in a
checkout that already has them, or you were given them separately), running
them requires Docker, because the repository tests start a real PostgreSQL 18
container through Testcontainers. No test mocks SQL.
