import type {SessionState} from '../session';

/** Имя модуля-механики — как модули `GameRules` на бэкенде. */
export type SessionModuleName = 'core' | 'turns' | 'timer';

/**
 * Модуль-механика партии: guard своего блока состояния (проверяет только свой
 * блок по сгенерированной схеме, остальное не трогает).
 */
export interface SessionModule {
  name: SessionModuleName;
  isBlock: (state: SessionState) => boolean;
}
