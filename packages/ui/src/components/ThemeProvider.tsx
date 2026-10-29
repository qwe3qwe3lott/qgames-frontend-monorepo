import type * as React from 'react';
import {ThemeProvider as NextThemesProvider} from 'next-themes';

/**
 * Тема приложения (класс на `<html>`, см. `@custom-variant dark` в globals.css).
 * Пока тема одна — light; когда появится переключатель, `forcedTheme` убрать.
 */
function ThemeProvider({children}: {children: React.ReactNode}) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      // Скрипт против мигания темы нужен только при SSR, в CSR он не выполняется;
      // тип data-блока убирает предупреждение React о <script> в компоненте.
      scriptProps={{type: 'application/json'}}
    >
      {children}
    </NextThemesProvider>
  );
}

export {ThemeProvider};
