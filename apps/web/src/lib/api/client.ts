const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ data: T; status: number }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Clerk sends auth header via middleware
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  const json = await res.json();
  return { data: json.data ?? json, status: res.status };
}

export const api = {
  get:    <T = any>(path: string) => request<T>('GET', path),
  post:   <T = any>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch:  <T = any>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};
