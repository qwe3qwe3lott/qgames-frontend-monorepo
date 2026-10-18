import type {UserResponse} from '@qgames/api/gateway/model';

/** Текущий пользователь, приведённый к обязательным полям. */
export interface Viewer {
  id: string;
  nickname: string;
  avatar: 'CAT' | 'DOG' | null;
}

/** Поля ответа в контракте optional (CLAUDE.md §5), поэтому проверяем явно. */
export function toViewer(user: UserResponse): Viewer | null {
  if (user.id === undefined) {
    return null;
  }
  return {
    id: user.id,
    nickname: user.nickname ?? user.email ?? 'Игрок',
    avatar: user.avatar ?? null,
  };
}
