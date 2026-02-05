import { z } from "zod";

export const rpsInput = z.object({
  choice: z.enum(["rock", "paper", "scissors"]).describe(
    "Your choice: rock|paper|scissors"
  ),
});
