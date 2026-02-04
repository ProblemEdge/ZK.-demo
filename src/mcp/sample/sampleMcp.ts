import { z } from 'zod';

// サンプルMCPの引数スキーマ定義
export const sampleMcpSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
  value: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
});

// サンプルMCPの型
export type SampleMcpInput = z.infer<typeof sampleMcpSchema>;

// サンプルMCP本体
export function runSampleMcp(input: SampleMcpInput) {
  sampleMcpSchema.parse(input); // バリデーション
  // ここにMCPのロジックを記述
  return {
    message: `Action: ${input.action}, Value: ${input.value}, Active: ${input.isActive}`,
    userId: input.userId,
  };
}
