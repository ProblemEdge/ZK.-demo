import Link from 'next/link';
import { use } from 'react';

interface PostLimitPageProps {
  searchParams?: Promise<{ limit?: string; resetAt?: string }>;
}

export default function PostLimitPage({ searchParams }: PostLimitPageProps) {
  const params = searchParams ? use(searchParams) : {};
  const limit = params?.limit ? Number(params.limit) : 5;
  const resetAt = params?.resetAt ? new Date(params.resetAt) : null;
  const resetText = resetAt && !Number.isNaN(resetAt.getTime())
    ? resetAt.toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })
    : '本日0時';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111827] border border-white/20 rounded-2xl p-6 text-center">
        <div className="text-2xl font-bold mb-3">本日の投稿上限に達しました</div>
        <p className="text-white/80 mb-4">
          本日の投稿可能回数は{limit}回です。
        </p>
        <p className="text-white/60 text-sm mb-6">
          リセット予定: {resetText}
        </p>
        <div className="flex gap-3">
          <Link
            href="/feed"
            className="flex-1 px-4 py-3 rounded-lg bg-white text-black font-semibold"
          >
            フィードへ
          </Link>
          <Link
            href="/profile"
            className="flex-1 px-4 py-3 rounded-lg border border-white/40 text-white font-semibold"
          >
            プロフィールへ
          </Link>
        </div>
      </div>
    </div>
  );
}
