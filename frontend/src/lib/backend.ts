// Lightweight backend connectivity check. Apollo Threat Lab runs its tests
// entirely on-device; this only pings the managed backend's health endpoint
// (via EXPO_PUBLIC_BACKEND_URL) so the client is wired to the deployed backend.
// It is fire-and-forget and never blocks the UI.

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function pingBackend(): Promise<boolean> {
  if (!BACKEND_URL) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
