import './styles/index.css';
// Первым: настройка Zod до создания схем в остальных модулях.
import './zodConfig';

import {configureApi} from '@qgames/api';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {GuestError} from '@/entities/user';

import {App} from './App';

// API — на том же origin, что и страница (dev-proxy Rsbuild, nginx в Docker; CLAUDE.md §5).
configureApi({baseUrl: '', authPath: '/api/auth'});

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Не найден элемент #root');
}

createRoot(rootElement, {
  // GuestError — штатный способ показать гостю окно входа (routes/_authenticated.tsx),
  // в консоль его не пишем. Остальные пойманные ошибки — как по умолчанию.
  onCaughtError: (error, errorInfo) => {
    if (error instanceof GuestError) {
      return;
    }
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
