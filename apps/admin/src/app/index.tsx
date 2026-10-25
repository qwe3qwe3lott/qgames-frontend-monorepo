import './styles/index.css';
// Первым: настройка Zod до создания схем в остальных модулях.
import './zod-config';

import {configureApi} from '@qgames/api';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {App} from './app';

// Админка ходит только в группу API admin (`/api/admin/**`, CLAUDE.md §1)
// на том же origin, что и страница (dev-proxy Rsbuild, nginx в Docker; CLAUDE.md §5).
configureApi({baseUrl: '', authPath: '/api/admin/auth'});

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Не найден элемент #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
