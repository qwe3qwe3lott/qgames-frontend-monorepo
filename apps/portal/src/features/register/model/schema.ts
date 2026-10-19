import {RegisterBody} from '@qgames/api/gateway/zod';
import type {z} from 'zod';

import {nicknameSchema} from '@/entities/user';

export const registerSchema = RegisterBody.extend({nickname: nicknameSchema});
export type RegisterValues = z.infer<typeof registerSchema>;
