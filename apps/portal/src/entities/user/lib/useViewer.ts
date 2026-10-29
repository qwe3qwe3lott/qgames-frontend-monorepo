import {isApiError} from '@qgames/api';
import {useGetCurrentUser} from '@qgames/api/portal';

import {toViewer, type Viewer} from '../model/types';

export type ViewerState =
  | {status: 'loading'}
  | {status: 'guest'}
  | {status: 'error'; error: unknown}
  | {status: 'user'; viewer: Viewer};

/** Кто смотрит страницу: гость (401) или пользователь. */
export function useViewer(): ViewerState {
  const {data, error, isPending} = useGetCurrentUser();
  if (isPending) {
    return {status: 'loading'};
  }
  if (isApiError(error) && error.status === 401) {
    return {status: 'guest'};
  }
  if (error !== null) {
    return {status: 'error', error};
  }
  return {status: 'user', viewer: toViewer(data)};
}
