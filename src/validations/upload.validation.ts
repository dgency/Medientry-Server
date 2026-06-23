import { z } from 'zod';

import { uploadKinds } from '../config/upload';

export const uploadSchema = z.object({
  body: z.object({
    kind: z.enum(uploadKinds).optional(),
  }),
});
