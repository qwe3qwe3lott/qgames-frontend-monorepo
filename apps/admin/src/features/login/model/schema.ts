import {LoginBody} from '@qgames/api/admin-gateway/zod';
import type {z} from 'zod';

export const loginSchema = LoginBody;
export type LoginValues = z.infer<typeof loginSchema>;
