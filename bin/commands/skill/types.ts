import { z } from "zod";

export const skillInput = z.object({
  name: z.string().min(1).describe("skill name (directory will be skills/<name>)"),
  lang: z
    .enum(["ts", "rust", "py"]) 
    .optional()
    .describe("preferred language: ts, rust, py"),
  desc: z.string().optional().describe("short description"),
});

export type SkillInput = z.infer<typeof skillInput>;

