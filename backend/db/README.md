# GTM Database Setup (Docker)

## Start PostgreSQL + pgAdmin

```bash
docker compose up -d
```

This starts:
| Service   | URL                        | Credentials                          |
|-----------|----------------------------|--------------------------------------|
| PostgreSQL | `localhost:5432`           | user: `gtm_user` / pass: `gtm_password` / db: `gtm_db` |
| pgAdmin   | http://localhost:5050      | email: `admin@hind.social` / pass: `admin123` |

---

## Connect pgAdmin to Postgres

1. Open http://localhost:5050
2. Login with `admin@hind.social` / `admin123`
3. Click **Add New Server**
4. **General tab** → Name: `GTM Local`
5. **Connection tab** →
   - Host: `postgres` *(use the Docker service name, NOT localhost)*
   - Port: `5432`
   - Database: `gtm_db`
   - Username: `gtm_user`
   - Password: `gtm_password`
6. Click **Save**

---

## Schema

The schema (`db/schema.sql`) is auto-run on first startup. Tables created:

| Table            | Description                                  |
|------------------|----------------------------------------------|
| `organizations`  | All subcommunities (claimed/unclaimed/failed) |
| `contacts`       | Multiple emails/phones per organization       |
| `events`         | Multiple events per organization              |
| `pipeline_runs`  | Log of every URL processed by the pipeline   |

---

## Stop / Reset

```bash
# Stop containers (data preserved)
docker compose down

# Stop AND delete all data (full reset)
docker compose down -v
```
