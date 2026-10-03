// Tile Table server: serves the game page and relays messages between players in a table.
// All game logic runs in the host's browser; the server only routes messages and keeps secrets
// (submitted words go to the host only; only the host may broadcast game state).
const http = require("http"), fs = require("fs"), path = require("path");
const { WebSocketServer } = require("ws");
const PORT = process.env.PORT || 3000, MAXP = 23;
const page = () => fs.readFileSync(path.join(__dirname, "public", "index.html"));
const server = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u === "/health") { res.writeHead(200); return res.end("ok"); }
  if (u === "/" || u === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(page());
  }
  res.writeHead(404); res.end("Not found");
});
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 16 * 1024 });
const rooms = new Map(); // code -> { host: ws, members: Set<ws> }
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
wss.on("connection", (ws) => {
  ws.alive = true; ws.on("pong", () => (ws.alive = true));
  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!ws.room) {
      const code = String(m.code || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
      const id = String(m.id || "").slice(0, 8);
      if (code.length !== 4 || !id) return send(ws, { op: "err", why: "bad" });
      if (m.op === "create") {
        if (rooms.has(code)) return send(ws, { op: "err", why: "taken" });
        rooms.set(code, { host: ws, members: new Set([ws]) });
      } else if (m.op === "join") {
        const r = rooms.get(code);
        if (!r) return send(ws, { op: "err", why: "notfound" });
        if (r.members.size >= MAXP + 2) return send(ws, { op: "err", why: "full" });
        r.members.add(ws);
      } else return;
      ws.room = code; ws.pid = id;
      return send(ws, { op: "ok" });
    }
    const r = rooms.get(ws.room); if (!r || typeof m.t !== "string") return;
    const out = JSON.stringify({ t: m.t, d: m.d, from: ws.pid });
    if (m.t === "state") { if (ws !== r.host) return; }           // only the host may publish game state
    if (m.t === "submit" || m.t === "join") { return send(r.host, { t: m.t, d: m.d, from: ws.pid }); } // private to host
    for (const c of r.members) if (c.readyState === 1) c.send(out);
  });
  ws.on("close", () => {
    const r = rooms.get(ws.room); if (!r) return;
    r.members.delete(ws);
    if (ws === r.host) { for (const c of r.members) send(c, { op: "closed" }); rooms.delete(ws.room); }
  });
});
setInterval(() => wss.clients.forEach((ws) => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); }), 30000);
server.listen(PORT, () => console.log("Tile Table running on port " + PORT));
