# Invite Stack

Premium invite card generator with layered card motion, share links, and optional restaurant image lookup from Google Places.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Node + Express

## Run Locally

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:8787`.

## Next.js Production Scaffold

New app scaffold:
- `/Users/shivat/Documents/invite/apps/web`

Run it locally:

```bash
npm install
npm run dev:web
```

It runs at `http://localhost:3000`.

Required env for API routes:
- `DATABASE_URL=<postgres_connection_string>`

## Google Restaurant Images

To fetch photos from Google:

1. Copy `server/.env.example` to `server/.env`
2. Set `GOOGLE_PLACES_API_KEY=<your_key>`
3. Restart the backend

If no key is set (or Google photo is unavailable), the API returns a fallback image URL.

## API Endpoints

- `GET /api/extract-swiggy?url=<swiggy_url>`
- `POST /api/parse-booking-text` with `{ "text": "<swiggy booking message>" }`
- `GET /api/google-image?name=<restaurant>&location=<area>`
- `GET /api/place-photo?photoName=<photo_name>`
- `GET /api/og.svg?name=&cuisine=&location=&time=`

## Next API Endpoints (Production Scaffold)

- `POST /api/invites`
- `GET /api/invites`
- `GET /api/invites/:slug`
- `PATCH /api/invites/:slug`
- Public page: `/i/:slug`

## Production Planning Docs

- `/Users/shivat/Documents/invite/docs/production/REPO_STRUCTURE.md`
- `/Users/shivat/Documents/invite/docs/production/ARCHITECTURE.md`
- `/Users/shivat/Documents/invite/docs/production/API_CONTRACT.md`
- `/Users/shivat/Documents/invite/docs/production/DELIVERY_PLAN.md`
- `/Users/shivat/Documents/invite/db/schema.sql`
