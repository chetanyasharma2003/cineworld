// Shared SSE push helper — imported by both notificationRoutes and any route that needs to push
// Using a module-level registry avoids circular imports between route files

const sseClients = new Map(); // userId (string) → Set<res>

export function registerSseClient(userId, res) {
  const key = String(userId);
  if (!sseClients.has(key)) sseClients.set(key, new Set());
  sseClients.get(key).add(res);
}

export function unregisterSseClient(userId, res) {
  const key = String(userId);
  const clients = sseClients.get(key);
  if (clients) {
    clients.delete(res);
    if (clients.size === 0) sseClients.delete(key);
  }
}

export function notifyUser(userId, notification) {
  const key = String(userId);
  const clients = sseClients.get(key);
  if (!clients?.size) return;
  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch {}
  }
}
