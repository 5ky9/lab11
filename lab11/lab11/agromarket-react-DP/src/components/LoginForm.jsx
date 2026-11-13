import { useState } from "react";
import { apiFetch } from "../api.js";

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' или 'register'
  const [error, setError] = useState("");
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setDetails([]);
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.target));

    try {
      // /auth/login или /auth/register — оба возвращают { user, token }
      const result = await apiFetch(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      onLogin(result.user, result.token);
    } catch (err) {
      setError(err.message); // для 429 — текст «Слишком много попыток…» из ответа сервера
      setDetails(err.details || []);
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h3>{isLogin ? "Вход" : "Регистрация"}</h3>

      {!isLogin && (
        <>
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" placeholder="Имя" required />
        </>
      )}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Email"
        required
      />

      <label htmlFor="password">Пароль</label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="Пароль (от 8 символов)"
        required
        minLength={8}
      />

      {error && <p className="error">{error}</p>}
      {details.length > 0 && (
        <ul className="error">
          {details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Подождите…" : isLogin ? "Войти" : "Зарегистрироваться"}
      </button>
      <button
        type="button"
        onClick={() => setMode(isLogin ? "register" : "login")}
      >
        {isLogin ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
      </button>
    </form>
  );
}
