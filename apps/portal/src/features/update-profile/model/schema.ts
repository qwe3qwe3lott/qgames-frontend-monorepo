import {UpdateProfileBody, UserResponse} from '@qgames/api/portal/zod';
import type {z} from 'zod';

import {nicknameSchema} from '@/entities/user';

/**
 * В форме оба поля всегда заполнены текущими значениями, поэтому они обязательны
 * (в запросе `UpdateProfileRequest` оба nullable — отправляем только изменённые).
 */
export const updateProfileSchema = UpdateProfileBody.extend({
  nickname: nicknameSchema,
  avatar: UserResponse.shape.avatar,
});
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
