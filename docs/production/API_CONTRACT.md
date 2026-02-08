# API Contract (v1)

Base URL: `/api`
Auth: bearer token for creator endpoints. Public endpoints require no auth unless invite is private.

## 1) Create Invite

`POST /api/invites`

Request:

```json
{
  "bookingText": "I have made a booking on 09 Feb 2026, 07:30 PM for 9 guest(s) ...",
  "manual": {
    "restaurantName": "The Happy Yard",
    "location": "Jubilee Hills, Hyderabad",
    "time": "2026-02-09T19:30:00+05:30",
    "peopleGoing": 9,
    "offer": "Flat 20% Off on Total Bill",
    "note": "Be there on time."
  },
  "visibility": "PUBLIC"
}
```

Response `201`:

```json
{
  "id": "inv_01J...",
  "slug": "hy7k2nq",
  "shareUrl": "https://invite.example.com/i/hy7k2nq",
  "status": "ACTIVE",
  "enrichmentStatus": "PENDING"
}
```

## 2) Get Invite by Slug (Public)

`GET /api/invites/:slug`

Response `200`:

```json
{
  "id": "inv_01J...",
  "slug": "hy7k2nq",
  "restaurantName": "The Happy Yard",
  "location": "Jubilee Hills, Hyderabad",
  "time": "2026-02-09T19:30:00+05:30",
  "peopleGoing": 9,
  "offer": "Flat 20% Off on Total Bill",
  "imageUrl": "https://...",
  "swiggyUrl": "https://swiggy.onelink.me/...",
  "restaurantId": "1084072",
  "status": "ACTIVE"
}
```

## 3) Update Invite (Creator)

`PATCH /api/invites/:slug`

Request:

```json
{
  "restaurantName": "The Happy Yard",
  "location": "Jubilee Hills, Hyderabad",
  "time": "2026-02-09T19:30:00+05:30",
  "offer": "Flat 20% Off on Total Bill",
  "note": "Sharp 7:30 PM."
}
```

## 4) Respond to Invite (Public)

`POST /api/invites/:slug/respond`

Request:

```json
{
  "name": "Aman",
  "phone": "+91XXXXXXXXXX",
  "response": "IN"
}
```

Response `200`:

```json
{
  "ok": true,
  "totals": {
    "in": 10,
    "maybe": 2,
    "out": 1
  }
}
```

## 5) Parse Booking Text

`POST /api/parse-booking`

Request:

```json
{
  "text": "Hey! I have made a booking on 09 Feb 2026, 07:30 PM for 9 guest(s) at The Happy Yard..."
}
```

Response `200`:

```json
{
  "restaurantName": "The Happy Yard",
  "location": "Jubilee Hills, Hyderabad",
  "time": "2026-02-09T19:30:00+05:30",
  "peopleGoing": 9,
  "offer": "Flat 20% Off on Total Bill",
  "restaurantId": "1084072",
  "swiggyUrl": "https://swiggy.onelink.me/..."
}
```

## 6) Trigger Enrichment

`POST /api/enrich`

Request:

```json
{
  "inviteId": "inv_01J..."
}
```

Response `202`:

```json
{
  "queued": true
}
```

## 7) Dynamic OG

`GET /api/og/:slug`

Response: image (`image/png` or `image/svg+xml`)

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "location is required",
    "details": []
  }
}
```

Common codes:
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

