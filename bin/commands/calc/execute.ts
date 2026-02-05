import { z } from "zod";
import { Output } from "../../shared/schema";
import { calcInput } from "./types";

export async function calcHandler(
  input: z.infer<typeof calcInput>
): Promise<Output> {
  if (input.op === "div" && input.b === 0) {
    return {
      error: "Division by zero is not allowed.",
      data: null,
    };
  }

  let result: number;
  switch (input.op) {
    case "add":
      result = input.a + input.b;
      break;
    case "sub":
      result = input.a - input.b;
      break;
    case "mul":
      result = input.a * input.b;
      break;
    case "div":
      result = input.a / input.b;
      break;
    default:
      return {
        error: "Unknown operation.",
        data: null,
      };
  }

  return {
    error: null,
    data: String(result),
  };
}
