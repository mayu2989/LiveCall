# LiveCall

A web-first, one-to-one video calling app with a Java / Spring Boot backend.

## Stack

- React + TypeScript + Vite
- Java 21+ + Spring Boot
- PostgreSQL + Flyway
- Spring Security: Google OpenID Connect
- LiveKit for WebRTC media

## Requirements

- Node.js 20+
- Docker with Docker Compose

## Start locally

1. Copy `.env.example` to `.env` and fill in Google and LiveKit credentials.
2. From the project root, start PostgreSQL and Spring Boot: `docker compose --profile app up`. Docker downloads the Java/Maven runtime and project dependencies on first start.
3. In another terminal, start the frontend: `cd frontend && npm install && npm run dev`.

The web client runs at http://localhost:5173, the API at http://localhost:8081, and PostgreSQL is exposed on port 5433. Vite proxies API and Google OAuth requests to Spring Boot. Google sign-in requires an OAuth client with `http://localhost:5173/login/oauth2/code/google` as an authorized redirect URI (or set `GOOGLE_REDIRECT_URI` to another configured callback). LiveKit credentials are required for real calls.

## Deploy the backend to Render

1. In Render, create a Web Service from this repository's `main` branch. Choose the Docker runtime, use the repository root as the build context, and set the Dockerfile path to `./Dockerfile`.
2. Set the health check path to `/api/health`. The service listens on Render's `PORT` environment variable.
3. Add runtime environment variables in Render (never commit `.env`): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `COOKIE_SECURE=true`.
4. For Neon, use its PostgreSQL connection details in `DB_URL` as a JDBC URL, for example `jdbc:postgresql://<host>/<database>?sslmode=require`; set the matching username and password separately. The app runs Flyway migrations at startup, so the database must be reachable on first deploy.
5. Once the Vercel frontend exists, use its origin for `FRONTEND_URL`. If Vercel proxies `/login/oauth2/code/google` to Render, set `GOOGLE_REDIRECT_URI` to that Vercel callback URL and authorize the same exact URI in Google Cloud. Store Google and LiveKit secrets only in Render's environment settings.

Vercel's `/api`, `/oauth2`, `/login`, and `/logout` rewrites should forward to this service so the browser can keep using same-origin URLs and session cookies.

## Configure Google sign-in

1. In Google Cloud Console, create or select a project and configure the OAuth consent screen / Google Auth Platform branding and audience.
2. For testing, keep the app in testing mode and add the Google accounts you will use as test users.
3. Create an OAuth client with application type **Web application**.
4. Add `http://localhost:5173/login/oauth2/code/google` as an authorized redirect URI. The frontend dev server proxies this callback to Spring Boot. Google requires an exact redirect URI match.
5. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

The app requests only OpenID Connect identity scopes: `openid`, `profile`, and `email`. No Google APIs need to be enabled for basic sign-in. For local testing, open the app, sign in, start a call, and use **Copy invite link** inside the call. Open that link in a second browser or ask another allowed Google test user to open it. The link carries a random room ID; each participant gets a short-lived token scoped to that room.

## Configure LiveKit

1. Create a LiveKit Cloud project and open its server/API credentials in the project settings.
2. Copy the project WebSocket URL into `LIVEKIT_URL` (it should start with `wss://`), and copy its API key and secret into `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in `.env`.
3. Keep these credentials only in the backend environment. The `/api/calls/token` endpoint creates a short-lived, room-scoped participant token; the browser receives that token, never the API secret.

Only the video and microphone controls are exposed in the call UI; chat and screen sharing are disabled.

## Current scope

The current MVP supports Google sign-in, starting a LiveKit room, and joining it through a private invite URL. Google profile details are read from the authenticated session; no sample contact accounts are used. Contacts, ringing/accept/decline, participant limits, and call history are not implemented yet. Do not expose LiveKit API secrets to the browser.

## Security notes

- Keep `.env` out of source control.
- Use HTTPS outside local development.
- Use a secure, HTTP-only session cookie; the backend enables CSRF protection for browser requests.
- Configure a real email provider before enabling password registration in production.
- Incoming-call notifications in a closed browser are subject to browser and OS push support and permission.
# LiveCall
