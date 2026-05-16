export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

type ApiRequestOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
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
