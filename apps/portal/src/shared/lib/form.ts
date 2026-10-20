import {isApiError} from '@qgames/api';
import type {FieldValues, Path, UseFormSetError} from 'react-hook-form';

/**
 * Тексты в `errors` бэкенд пишет по-английски для разработчиков, пользователю их
 * не показываем (CLAUDE.md §5). Обычно такие значения ловит клиентская Zod-схема.
 */
const SERVER_FIELD_MESSAGE = 'Сервер не принял это значение';

export interface ApplyFieldErrorsOptions {
  /**
   * Префикс имён полей в ответе сервера, если поля формы вложены в тело запроса
   * (например, `settings.` у создания комнаты).
   */
  prefix?: string;
}

/**
 * Подсвечивает поля из VALIDATION_ERROR (`ApiError.fieldErrors`) в форме.
 * Возвращает true, если хотя бы одна ошибка нашла своё поле.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  {prefix = ''}: ApplyFieldErrorsOptions = {},
): boolean {
  if (!isApiError(error)) {
    return false;
  }
  let applied = false;
  for (const field of fields) {
    if (`${prefix}${field}` in error.fieldErrors) {
      setError(field, {type: 'server', message: SERVER_FIELD_MESSAGE});
      applied = true;
    }
  }
  return applied;
}
