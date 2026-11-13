import { useState } from 'react';
import { apiFetch } from '../api.js';
 
export default function AddProductForm({ onAdded }) {
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDetails([]);
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
 
    try {
      // ЗАДАНИЕ: отправьте POST /products через apiFetch.
      // ЗАДАНИЕ: тело — data, но price — числом:
      // ЗАДАНИЕ: { ...data, price: Number(data.price) }
      const result = await apiFetch(`/products`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          price: Number(data.price),
        }),
      });
      const product = result;
 
      onAdded(product);      // сообщаем App о новом товаре
      form.reset();
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
    }
  }
 
  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>Новый товар</h3>
      <input name="name" placeholder="Название" required />
      <input name="category" placeholder="Категория" required />
      <input name="price" type="number" min="0.01" step="any" placeholder="Цена, ₸" required />
      <input name="unit" placeholder="Единица (кг, л)" defaultValue="кг" />
      {error && <p className="error">{error}</p>}
      {details.length > 0 && (
        <ul className="error">
          {details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}
      <button type="submit">Добавить</button>
    </form>
  );
}
