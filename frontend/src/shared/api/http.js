const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function http(path, options = {}) {
  const { headers, ...restOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}
