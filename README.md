# Meet - Simple Video Conferencing

A minimal video conferencing application powered by LiveKit Cloud and Next.js.

## Features

- No authentication required
- Create rooms instantly
- Share room URLs to invite participants
- Powered by LiveKit Cloud for reliable, scalable video infrastructure

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A LiveKit Cloud account ([sign up here](https://cloud.livekit.io/))

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your LiveKit Cloud credentials:
   - `LIVEKIT_API_KEY`: Your API key from LiveKit Cloud
   - `LIVEKIT_API_SECRET`: Your API secret from LiveKit Cloud
   - `LIVEKIT_URL`: Your LiveKit Cloud WebSocket URL (e.g., `wss://your-project.livekit.cloud`)

   You can find these credentials in your [LiveKit Cloud dashboard](https://cloud.livekit.io/).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Home Page:** Enter your name and a room name (or generate a random one)
2. **Join Room:** Click "Join Room" to enter the video conference
3. **Invite Others:** Share the room URL with others to invite them

No authentication is required - anyone with the room URL can join.

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── token/
│   │       └── route.ts          # API endpoint for generating LiveKit tokens
│   ├── rooms/
│   │   └── [name]/
│   │       └── page.tsx          # Room video conference page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── .env.example                  # Environment variables template
└── package.json                  # Dependencies
```

## Docker

### Building the Docker Image

Build the Docker image locally:
```bash
docker build -t meet .
```

### Running with Docker

Run the container with your LiveKit credentials:
```bash
docker run -p 3000:3000 \
  -e LIVEKIT_API_KEY=your_api_key \
  -e LIVEKIT_API_SECRET=your_api_secret \
  -e LIVEKIT_URL=wss://your-project.livekit.cloud \
  meet
```

Or use a `.env` file:
```bash
docker run -p 3000:3000 --env-file .env meet
```

### Automated Docker Builds

This repository includes a GitHub Actions workflow that automatically builds and pushes a Docker image to GitHub Container Registry when code is pushed to the `main` branch.

The image will be available at:
```
ghcr.io/<your-username>/meet:latest
```

To pull and run the latest image:
```bash
docker pull ghcr.io/<your-username>/meet:latest
docker run -p 3000:3000 --env-file .env ghcr.io/<your-username>/meet:latest
```

## Deployment

This app can be deployed to any platform that supports Next.js or Docker:

- [Vercel](https://vercel.com) (recommended for Next.js)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- Any Docker-compatible hosting (AWS ECS, Google Cloud Run, DigitalOcean, etc.)
- Or any Node.js hosting platform

Make sure to configure the environment variables in your deployment platform.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **LiveKit** - Real-time video/audio infrastructure
- **TypeScript** - Type safety
- **LiveKit Components** - Pre-built React components for video conferencing

## License

MIT
