import './styles/index.css';

import {configureApi} from '@qgames/api';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {z} from 'zod';

import {env} from '@/shared/config';

import {App} from './app';

// Сообщения валидации форм (в том числе Orval-схем) — на русском.
z.config(z.locales.ru());
configureApi({baseUrl: env.PUBLIC_API_URL});

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Не найден элемент #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
