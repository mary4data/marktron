# Google Cloud SQL Setup for marktron

## Provision the instance (one-time, ~5 min)

1. Go to console.cloud.google.com → SQL → Create Instance → PostgreSQL
2. Instance ID: `marktron-db`
3. Region: `europe-west1` (Berlin-adjacent, low latency)
4. Machine: Shared core, 1 vCPU, 614MB (cheapest, fine for hackathon)
5. Storage: 10GB SSD
6. Set a strong root password → save it
7. Under Connections → add your current IP to authorized networks (for direct connection during dev)
8. Click Create — wait ~3 min

## Create the database and user

In Cloud Shell or psql:

```sql
CREATE DATABASE marktron;
CREATE USER marktron_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE marktron TO marktron_user;
```

## Get the connection string

**Public IP (direct, for local dev):**
```
postgresql://marktron_user:PASSWORD@PUBLIC_IP:5432/marktron
```

**Cloud SQL Auth Proxy (for Vercel / production):**
```
postgresql://marktron_user:PASSWORD@localhost:5432/marktron
```
With proxy running:
```
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
```

## For Vercel deployment

Set `DATABASE_URL` as an environment variable in Vercel project settings.

Enable Cloud SQL connections in Vercel via the Google Cloud SQL integration or use the public IP with SSL required.

The `DATABASE_URL` format for Cloud SQL Auth Proxy (used in production):
```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
```

## Running the schema migration

After setting `DATABASE_URL` in `.env.local`:

```bash
npm run db:migrate
```

Then seed demo data:

```bash
# Start the dev server, then hit:
curl http://localhost:3000/api/seed
```
