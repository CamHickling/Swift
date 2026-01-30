# Swift - Indoor Cycling App

A web-based fitness tracking app for smart trainers (Wahoo KICKR) and heart rate monitors (Wahoo TICKR). Features live data display, structured workouts, workout history, and Strava integration.

## Features

- **Device Connection**: Connect to FTMS-compatible trainers and heart rate monitors via Web Bluetooth
- **Live Data Display**: Real-time power, heart rate, cadence, and speed
- **Trainer Control**: ERG mode (target watts) and resistance mode
- **Structured Workouts**: Create and run interval workouts with auto-adjusting targets
- **Workout Recording**: Record rides with 1Hz sample data
- **Analysis**: Post-workout charts and summary statistics
- **Strava Upload**: Automatic upload to Strava (requires setup)
- **Offline-First**: All data stored locally in browser (IndexedDB)

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

Open http://localhost:5173 in **Chrome** (Web Bluetooth requires Chrome).

## Deploy to GitHub Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/Swift.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: GitHub Actions
3. The workflow will auto-deploy on push to `main`

### 3. (Optional) Set Up Strava Integration

See the [Strava Setup Guide](#strava-integration) below.

## Strava Integration

Strava upload requires a small Cloudflare Worker to securely handle OAuth tokens.

### Step 1: Create Strava API App

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create application:
   - **Website**: `https://yourusername.github.io/Swift`
   - **Authorization Callback Domain**: `yourusername.github.io`
3. Note your **Client ID** and **Client Secret**

### Step 2: Deploy the Token Exchange Worker

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare (free account)
wrangler login

# Set secrets
cd worker
wrangler secret put STRAVA_CLIENT_ID    # Enter your Client ID
wrangler secret put STRAVA_CLIENT_SECRET # Enter your Client Secret

# Deploy
wrangler deploy
```

Note the worker URL (e.g., `https://swift-strava-auth.yourusername.workers.dev`)

### Step 3: Configure GitHub Secrets

In your repo Settings → Secrets → Actions, add:

| Secret | Value |
|--------|-------|
| `VITE_STRAVA_CLIENT_ID` | Your Strava Client ID |
| `VITE_STRAVA_REDIRECT_URI` | `https://yourusername.github.io/Swift/#/strava/callback` |
| `VITE_TOKEN_EXCHANGE_URL` | Your Cloudflare Worker URL |

### Step 4: Redeploy

Push a commit or manually trigger the deploy workflow.

## Local Development with Strava

Create a `.env` file:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_REDIRECT_URI=http://localhost:5173/#/strava/callback
VITE_TOKEN_EXCHANGE_URL=https://your-worker.workers.dev
```

Note: You'll need to add `localhost` to your Strava app's callback domain for local testing.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper
- **Recharts** - Charts
- **Web Bluetooth API** - Device connectivity

## Browser Support

**Chrome only** - Web Bluetooth is required and only supported in Chromium browsers.

## License

MIT
