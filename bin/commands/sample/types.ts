import { z } from "zod";

export const sampleInput = z.object({
  prompt: z.string().describe("using this, execute llm function"),
});
