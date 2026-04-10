# NEXUS Event Management

This project now includes a Node.js + Express backend backed by MongoDB.

## Stack

- Frontend: existing static HTML/CSS/JS pages
- Backend: Express
- Database: MongoDB with Mongoose
- Auth: JWT-based CMS login

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update the values:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nexus_event_management
JWT_SECRET=replace-this-with-a-strong-secret
```

3. Start the app:

```bash
npm start
```

4. Open:

- Public site: `http://localhost:4000/`
- CMS login: `http://localhost:4000/cms/login.html`

## Default CMS Users

- `admin` / `nexus2026`
- `organiser` / `nexus123`

These are seeded automatically the first time the backend starts with an empty database.

## What Changed

- Public registrations now save to MongoDB.
- CMS login now authenticates against MongoDB users.
- Dashboard, registrations, scores, championship, settings, timeline, users, and audit log now load/save through the backend API.
- The landing page now pulls site settings and timeline data from the backend.
