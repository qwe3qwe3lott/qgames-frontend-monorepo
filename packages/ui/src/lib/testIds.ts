/**
 * Идентификаторы `data-testid` компонента для e2e-тестов (`e2e/`). `root` — имя
 * компонента, остальные ключи — его элементы.
 */
export interface TestIds {
  readonly root: string;
}

/** testIds компонента `N` с элементами `K`: значения типизированы литералами. */
export type ComponentTestIds<N extends string, K extends string> = {
  readonly root: N;
} & {readonly [P in K]: `${Uncapitalize<N>}__${P}`};

/**
 * `generateTestIds('NotFoundPage', ['homeLink'])` →
 * `{root: 'NotFoundPage', homeLink: 'notFoundPage__homeLink'}`.
 * Вызывается в файле `<Компонент>.testIds.ts` рядом с компонентом.
 */
export function generateTestIds<const N extends string, const K extends string>(
  name: N,
  keys: readonly K[],
): ComponentTestIds<N, K> {
  const prefix = name.charAt(0).toLowerCase() + name.slice(1);
  const ids: Record<string, string> = {root: name};
  for (const key of keys) {
    ids[key] = `${prefix}__${key}`;
  }
  // Объект собран выше ровно по ключам `root` и `K` со значениями по шаблону
  // типа, но TS не выводит mapped type из цикла.
  return ids as ComponentTestIds<N, K>;
}
