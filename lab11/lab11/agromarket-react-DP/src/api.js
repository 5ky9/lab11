export const API_URL = import.meta.env.VITE_API_URL || 'https://agromarket-api-dmtrp.onrender.com/api';
// export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
 
// Обёртка над fetch: добавляет токен, разбирает JSON и превращает ошибки API в исключения
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
 
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
 
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  // тело может быть не JSON (например HTML-страница прокси) — не падаем на разборе
  const data = res.status === 204 ? null : await res.json().catch(() => null);
 
  // Токен был, но сервер его не принял (истёк / подделан) — выходим из аккаунта
  if (res.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }
 
  if (!res.ok) {
    const err = new Error(data?.error || `Ошибка ${res.status}`);
    err.status = res.status;
    err.details = data?.details || []; // ошибки валидации zod: [{ field, message }]
    throw err;
  }
  return data;
}
