# Как применить в agromarket-api (5 минут)

Этого репозитория в архиве не было, поэтому файлы лежат отдельно. Копируйте в свой agromarket-api.

```bash
git switch main && git pull && npm ci && git switch -c security/hardening
npm install helmet express-rate-limit zod
npm install -D supertest   # если ещё нет

# скопировать (структура папок та же):
#   src/middleware/rateLimit.js
#   src/middleware/validate.js      (validate, idParam, errorHandler)
#   src/validation/schemas.js
#   tests/validation.test.js
```

## Правки в вашем коде (4 места)

**src/app.js** — до маршрутов (замените старый `app.use(cors())`):
```js
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/validate.js';

app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));   // выше всех маршрутов
// ... маршруты ...
app.use(errorHandler);                        // ПОСЛЕДНИМ, после маршрутов
```

**src/routes/auth.js**
```js
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login',    authLimiter, validate(loginSchema),    login);
```

**src/routes/products.js**
```js
import { validate, idParam } from '../middleware/validate.js';
import { productSchema, productUpdateSchema } from '../validation/schemas.js';
router.get('/:id',    idParam, getProduct);
router.post('/',      requireAuth, requireRole('farmer', 'admin'), validate(productSchema), createProduct);
router.patch('/:id',  requireAuth, requireRole('farmer', 'admin'), idParam, validate(productUpdateSchema), updateProduct);
router.delete('/:id', requireAuth, requireRole('farmer', 'admin'), idParam, deleteProduct);  // если есть
```
`idParam` добавьте и на все остальные маршруты с `/:id`.

**tests/validation.test.js** — замените заглушку `getFarmerToken()` на свой хелпер из ЛР8.
Если роль по умолчанию у вас не `buyer` — поправьте строку в тесте про `role`.

**Render → Environment:** `CORS_ORIGINS=https://agromarket-dmtrp.vercel.app,http://localhost:5173`
(плюс адреса Preview-деплоев Vercel, если ими пользуетесь). После этого Manual Deploy.

## Проверка
```bash
NODE_ENV=test npm test      # 11 тестов валидации + старые ЛР8 — зелёные
```
Если старые тесты упали с 400 — в них невалидные данные (цена ≤ 0, нет category и т.п.), исправьте данные, не схему.

`REFERENCE_app.example.js` — рабочий пример app.js, на котором я прогнал все файлы (11/11 тестов, цикл 401→429 проверен).
