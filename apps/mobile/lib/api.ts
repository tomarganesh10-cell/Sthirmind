const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://sthirmind.hopecommonersfoundation.com/api/v1';

export const api = {
  get: (path: string) =>
    fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
  post: (path: string, body?: any) =>
    fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json()),
  patch: (path: string, body?: any) =>
    fetch(`${API_URL}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json()),
};
