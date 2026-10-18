import './styles/index.css';
// Переменные окружения проверяются при старте; клиент admin-gateway подключится позже.
import '@/shared/config';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {App} from './app';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Не найден элемент #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
