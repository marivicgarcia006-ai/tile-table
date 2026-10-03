# Tile Table

A real-time word game for up to 23 players. The host creates a table and shares an invite link
(`https://your-site/?t=ABCD`). Anyone who opens it just types a name and is in. No accounts.

## Run it on your computer
    npm install
    npm start          # then open http://localhost:3000

## Put it on the internet (free, ~5 minutes) — Render.com
1. Create a free account at github.com and make a new repository; upload these files
   (`server.js`, `package.json`, `package-lock.json`, `public/`). Do NOT upload `node_modules`.
2. Create a free account at render.com -> New -> Web Service -> connect that repository.
3. Settings: Runtime = Node, Build Command = `npm install`, Start Command = `npm start`, Instance type = Free.
4. Click Deploy. Render gives you a link like `https://tile-table.onrender.com`. That is your game.
   Share it, or have the host share the invite link shown in the lobby.

Notes: on Render's free plan the site sleeps after ~15 minutes idle, so the first visit may take about
a minute to wake up. Open it a few minutes before class. Railway, Fly.io and Glitch also work:
any host that runs Node.js and supports WebSockets will do. Tables live in memory, so a restart ends
games in progress.

## How it works
`server.js` serves the page and relays messages inside each table. The game rules run in the host's
browser. The server keeps submitted words private (only the host receives them) and only lets the host
publish game state. The ENABLE word list (public domain) is embedded in `public/index.html`.
