// Проверяет req.body по zod-схеме. В обработчик попадают только очищенные данные.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  req.body = result.data; // лишние поля (например role) отброшены
  next();
};

// GET /api/products/abc или /api/products/-1 не должны давать 500 из базы
export const idParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  req.params.id = id;
  next();
};

// JSON-ответы вместо HTML-страницы Express для ошибок разбора тела (413, битый JSON)
// Подключать ПОСЛЕ всех маршрутов (последним app.use).
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Тело запроса слишком большое (максимум 100 КБ)' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};
