import type {UserResponse} from '@qgames/api/gateway/model';

/** Текущий пользователь — то, что нужно интерфейсу. */
export interface Viewer {
  id: string;
  nickname: string;
  avatar: 'CAT' | 'DOG' | null;
}

export function toViewer(user: UserResponse): Viewer {
  return {id: user.id, nickname: user.nickname, avatar: user.avatar};
}
