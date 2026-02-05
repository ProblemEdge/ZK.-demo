import { z } from "zod";

export const calcInput = z.object({
  a: z.coerce.number().describe("First number (coerced from string)"),
  b: z.coerce.number().describe("Second number (coerced from string)"),
  op: z
    .enum(["add", "sub", "mul", "div"])
    .describe("Operation: add|sub|mul|div"),
});
