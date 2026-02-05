import { z } from "zod";
import { Output } from "../../shared/schema";
import { sampleInput } from "./types";

export async function sampleHandler(
  input: z.infer<typeof sampleInput>
): Promise<Output> {
  return {
    error: null,
    data: `You said: ${input.prompt}`,
  };
}
