import { z } from "zod";

export const OutputSchema = z.object({
  error: z.string().nullable(),
  data: z.string().nullable(),
});

export type Output = z.infer<typeof OutputSchema>;

export default OutputSchema;
