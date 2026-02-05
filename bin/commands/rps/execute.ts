import { z } from "zod";
import { Output } from "../../shared/schema";
import { rpsInput } from "./types";

export async function rpsHandler(
  input: z.infer<typeof rpsInput>
): Promise<Output> {
  const choices = ["rock", "paper", "scissors"] as const;
  const cpu = choices[Math.floor(Math.random() * choices.length)];
  const user = input.choice;

  let result: string;
  if (user === cpu) {
    result = "draw";
  } else if (
    (user === "rock" && cpu === "scissors") ||
    (user === "paper" && cpu === "rock") ||
    (user === "scissors" && cpu === "paper")
  ) {
    result = "win";
  } else {
    result = "lose";
  }

  return {
    error: null,
    data: JSON.stringify({ user, cpu, result }),
  };
}
