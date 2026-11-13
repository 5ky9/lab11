// ТЕСТОВЫЙ СТЕНД: имитирует структуру agromarket-api из ЛР7–ЛР8, чтобы проверить новые файлы.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authLimiter } from './src/middleware/rateLimit.js';
import { validate, idParam, errorHandler } from './src/middleware/validate.js';
import { registerSchema, loginSchema, productSchema, productUpdateSchema } from './src/validation/schemas.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

const users = []; const products = [{ id: 1, name: 'Картофель', price: 350, category: 'Овощи' }];
const requireAuth = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t) return res.status(401).json({ error: 'Нет токена' });
  req.user = { role: t }; next();
};
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Нет прав' });

app.post('/api/auth/register', authLimiter, validate(registerSchema), (req, res) => {
  const user = { id: users.length + 1, ...req.body, role: 'buyer' };
  users.push(user);
  res.status(201).json({ user: { id: user.id, name: user.name, role: user.role }, token: 'x' });
});
app.post('/api/auth/login', authLimiter, validate(loginSchema), (req, res) =>
  res.status(401).json({ error: 'Неверный e-mail или пароль' }));
app.get('/api/products', (req, res) => res.json(products));
app.get('/api/products/:id', idParam, (req, res) => {
  const p = products.find((x) => x.id === req.params.id);
  return p ? res.json(p) : res.status(404).json({ error: 'Не найдено' });
});
app.post('/api/products', requireAuth, requireRole('farmer', 'admin'), validate(productSchema), (req, res) =>
  res.status(201).json({ id: products.length + 1, ...req.body }));
app.patch('/api/products/:id', requireAuth, requireRole('farmer', 'admin'), idParam, validate(productUpdateSchema), (req, res) =>
  res.json({ id: req.params.id, ...req.body }));

app.use(errorHandler);
export default app;
