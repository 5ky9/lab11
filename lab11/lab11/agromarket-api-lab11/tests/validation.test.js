import request from 'supertest';
import app from '../src/app.js';

// getFarmerToken — ваш хелпер из ЛР8 (замените на свой: залогиниться фермером/админом и вернуть token)
async function getFarmerToken() {
  return 'farmer';
}

describe('Валидация', () => {
  test('регистрация с некорректным e-mail → 400 и поле email в details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email: 'не-почта', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('email');
  });

  test('нельзя зарегистрироваться админом через поле role', async () => {
    const email = `role${Date.now()}@test.kz`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Хакер', email, password: '12345678', role: 'admin' });

    expect(res.status).toBe(201);
    // роль по умолчанию — buyer; поле role из запроса не дошло до обработчика
    expect(res.body.user.role).toBe('buyer');
  });

  test('пароль из 7 символов → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email: `short${Date.now()}@test.kz`, password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('password');
  });

  test('товар с отрицательной ценой → 400', async () => {
    const token = await getFarmerToken();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Мёд', price: -500, category: 'Мёд' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('price');
  });

  test('цена-строка "3500" из формы принимается (z.coerce)', async () => {
    const token = await getFarmerToken();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Мёд', price: '3500', category: 'Мёд' });

    expect(res.status).toBe(201);
    expect(res.body.price).toBe(3500);
  });

  test('GET /api/products/abc → 400, а не 500', async () => {
    const res = await request(app).get('/api/products/abc');
    expect(res.status).toBe(400);
  });

  test('PATCH товара с пустым телом {} → 400', async () => {
    const token = await getFarmerToken();
    const res = await request(app)
      .patch('/api/products/1')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('тело больше 100 КБ → 413', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x'.repeat(200_000), email: 'a@a.kz', password: '12345678' });

    expect(res.status).toBe(413);
  });

  test('helmet: X-Powered-By отсутствует, X-Content-Type-Options есть', async () => {
    const res = await request(app).get('/api/products');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('CORS: чужой Origin не получает Access-Control-Allow-Origin', async () => {
    const res = await request(app).get('/api/products').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('CORS: свой Origin разрешён', async () => {
    const res = await request(app).get('/api/products').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
