import {useGetCurrentAdmin} from '@qgames/api/admin';
import type {AdminResponse} from '@qgames/api/admin/model';

import {isGuestError} from './guest';

export type CurrentAdminState =
  | {status: 'loading'}
  | {status: 'guest'}
  | {status: 'error'; error: unknown}
  | {status: 'admin'; admin: AdminResponse};

/** Кто открыл админку: гость или администратор текущей сессии. */
export function useCurrentAdmin(): CurrentAdminState {
  const {data, error, isPending} = useGetCurrentAdmin();
  if (isPending) {
    return {status: 'loading'};
  }
  if (isGuestError(error)) {
    return {status: 'guest'};
  }
  if (error !== null) {
    return {status: 'error', error};
  }
  return {status: 'admin', admin: data};
}
