import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
});

export type UserDTO = z.infer<typeof UserSchema>;
