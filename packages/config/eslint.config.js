// @ts-check
import {createConfig} from './eslint/index.js';

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  // У пакета нет tsconfig: типы JS-модулей (*.d.ts) проверяет tsc приложений, которые их импортируют.
  ignores: ['**/*.d.ts'],
});
