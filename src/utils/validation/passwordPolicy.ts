import { refine, z } from 'zod';
import zxcvbn from 'zxcvbn';

export function passwordPolicy() {
  return z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .refine((pw) => /[A-Z]/.test(pw), {
      message: 'Password must contain at least one uppercase letter',
    })
    .refine((pw) => /[a-z]/.test(pw), {
      message: 'Password must contain at least one lowercase letter',
    })
    .refine((pw) => /[0-9]/.test(pw), {
      message: 'Password must contain at least one number',
    })
    .refine((pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw), {
      message: 'Password must contain at least one special character',
    })
    .refine((pw) => !/\s/.test(pw), {
      message: 'Password must not contain whitespace',
    })
    .refine((pw) => zxcvbn(pw).score >= 3, {
      message: 'Password is too weak — try making it longer or less predictable',
    });
}
