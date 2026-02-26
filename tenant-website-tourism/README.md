# Tenant Website Tourism (Next.js)

Phase 4 public tenant tourism website with pages:

- Home
- Destinations
- Tours
- About
- Contact

Lead form submissions are sent to `POST /api/public/leads` and stored in tenant CRM data.

## Run locally

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Install and start:

```bash
npm install
npm run dev
```

3. Open:

```bash
http://localhost:3001
```

## Environment variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend base URL for public tenant APIs.
- `NEXT_PUBLIC_SAAS_HOME_URL`: SaaS marketing/home URL used for redirect when tenant host is not registered.

Example:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.luxury-uaeproperty.com
NEXT_PUBLIC_SAAS_HOME_URL=https://www.luxury-uaeproperty.com
```

## Tenant resolution notes

Backend resolves tenant from host headers. This app forwards current host using `x-tenant-host`.

If the tenant is not found for the incoming host, the app redirects to `NEXT_PUBLIC_SAAS_HOME_URL` (fallback: `https://www.luxury-uaeproperty.com`).

For local testing of a specific tenant, add a local host mapping (example):

```text
127.0.0.1 alpha.localhost
```

Then open `http://alpha.localhost:3001`.
