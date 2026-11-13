import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя — минимум 2 символа').max(100, 'Имя — максимум 100 символов'),
  email: z.string().trim().toLowerCase().email('Некорректный e-mail'),
  password: z.string().min(8, 'Пароль — минимум 8 символов').max(72, 'Пароль — максимум 72 символа'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный e-mail'),
  password: z.string().min(1, 'Введите пароль').max(72, 'Пароль — максимум 72 символа'),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Название — минимум 2 символа').max(200, 'Название — максимум 200 символов'),
  price: z.coerce.number('Цена должна быть числом').positive('Цена должна быть больше 0').max(10_000_000, 'Цена слишком большая'),
  category: z.string().trim().min(1, 'Укажите категорию').max(50, 'Категория — максимум 50 символов'),
  unit: z.string().trim().max(20, 'Единица — максимум 20 символов').optional(),
  description: z.string().trim().max(2000, 'Описание — максимум 2000 символов').optional(),
  stock: z.coerce.number().int('Остаток — целое число').min(0, 'Остаток не может быть отрицательным').max(1_000_000).optional(),
  image: z.string().trim().url('Некорректная ссылка на картинку').max(500).optional(),
});

// для PATCH/PUT: все поля необязательны, но хотя бы одно должно быть
export const productUpdateSchema = productSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Нет полей для обновления');
