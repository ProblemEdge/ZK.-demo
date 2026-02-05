import { OutputSchema } from "./shared/schema";

import * as sampleFunction from "./commands/sample";
import * as calcFunction from "./commands/calc";
import * as rpsFunction from "./commands/rps";

//
// 1. Register Commands
//
const commands = {
  sample: {
    input: sampleFunction.sampleInput,
    handler: sampleFunction.sampleHandler,
  },
  calc: {
    input: calcFunction.calcInput,
    handler: calcFunction.calcHandler,
  },
  rps: {
    input: rpsFunction.rpsInput,
    handler: rpsFunction.rpsHandler,
  },
} as const;

//
// 2. flag パーサ
//
function parseFlags(args: string[]) {
  const out: Record<string, string> = {};
  let key: string | null = null;

  for (const arg of args) {
    if (arg.startsWith("--")) {
      key = arg.slice(2);
    } else if (key) {
      out[key] = arg;
      key = null;
    }
  }
  return out;
}

//
// 3. CLI 実行
//
async function main() {
  const [, , cmdName, ...rawArgs] = process.argv;

  const cmd = commands[cmdName as keyof typeof commands];
  if (!cmd) {
    console.error(`Unknown command: ${cmdName}`);
    process.exit(1);
  }

  const flags = parseFlags(rawArgs);
  const parsedInput = cmd.input.safeParse(flags);

  if (!parsedInput.success) {
    const message = parsedInput.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");

    console.error(message);
    process.exit(1);
  }

  const output = await cmd.handler(parsedInput.data);

  const parsedOutput = OutputSchema.safeParse(output);
  if (!parsedOutput.success) {
    console.error("Invalid output format");
    process.exit(1);
  }

  if (parsedOutput.data.error) {
    console.error(parsedOutput.data.error);
    process.exit(1);
  } else {
    console.log(parsedOutput.data.data ?? "");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
