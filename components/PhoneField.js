import React from 'react';
import TextField from './TextField';

// Оставляем только цифры
const digits = (s) => (s || '').replace(/\D+/g, '');

// Маска формата +7 XXX XXX XX XX
export const formatKZPhone = (input) => {
  let d = digits(input);

  // Нормализуем начало: 8XXXXXXXXXX или 7XXXXXXXXXX -> +7
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;     // подстрахуемся
  d = d.slice(0, 11);                      // максимум 11 цифр с лидером 7

  const p = d.padEnd(11, '_');             // для красивого плейсхолдера можно убрать
  const a = p.slice(1, 4);                 // XXX
  const b = p.slice(4, 7);                 // XXX
  const c = p.slice(7, 9);                 // XX
  const e = p.slice(9, 11);                // XX

  // Собираем видимую строку из фактических введённых цифр
  const len = d.length;
  let out = '+7';
  if (len > 1) out += ' ' + d.slice(1, Math.min(4, len));
  if (len > 4) out += ' ' + d.slice(4, Math.min(7, len));
  if (len > 7) out += ' ' + d.slice(7, Math.min(9, len));
  if (len > 9) out += ' ' + d.slice(9, Math.min(11, len));
  return out;
};

export default function PhoneField({ value, onChangeText, ...rest }) {
  const handleChange = (t) => {
    const v = formatKZPhone(t);
    onChangeText?.(v);
  };

  return (
    <TextField
      keyboardType="number-pad"
      autoComplete="tel"
      placeholder="+7 ___ ___ __ __"
      value={value}
      onChangeText={handleChange}
      {...rest}
    />
  );
}
