# Strava OAuth Token Exchange Worker

This Cloudflare Worker handles the secure exchange of Strava OAuth tokens.

## Setup

### 1. Create a Strava API Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application:
   - **Application Name**: Swift (or whatever you want)
   - **Category**: Training
   - **Website**: Your GitHub Pages URL (e.g., `https://yourusername.github.io/swift`)
   - **Authorization Callback Domain**: `yourusername.github.io`
3. Note your **Client ID** and **Client Secret**

### 2. Deploy the Worker

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set your secrets:
   ```bash
   cd worker
   wrangler secret put STRAVA_CLIENT_ID
   # Enter your Client ID when prompted

   wrangler secret put STRAVA_CLIENT_SECRET
   # Enter your Client Secret when prompted
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

5. Note the worker URL (e.g., `https://swift-strava-auth.yourusername.workers.dev`)

### 3. Configure the App

Create a `.env` file in the project root:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_REDIRECT_URI=https://yourusername.github.io/swift/#/strava/callback
VITE_TOKEN_EXCHANGE_URL=https://swift-strava-auth.yourusername.workers.dev
```

For local development, use:
```env
VITE_STRAVA_REDIRECT_URI=http://localhost:5173/#/strava/callback
```

## How It Works

1. User clicks "Connect with Strava" in the app
2. User is redirected to Strava to authorize
3. Strava redirects back with an authorization code
4. App sends code to this worker
5. Worker exchanges code for tokens using the secret client credentials
6. Worker returns tokens to the app
7. App stores tokens and can upload activities

The client secret never leaves the worker, keeping it secure.
