const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://satkhirar-amm-backend.vercel.app"
    : "http://localhost:5000";
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || DEFAULT_API_URL
).replace(/\/$/, "");

type ApiRequestOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: method === "GET" ? "no-store" : options.cache,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "API request failed.");
  }

  return payload as T;
}

export function getApiError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Backend API is not running or MongoDB connection is blocked.";
  }

  return error instanceof Error ? error.message : fallback;
}
