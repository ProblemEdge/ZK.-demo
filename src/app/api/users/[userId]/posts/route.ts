import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    // オプションで閲覧者の認証トークンを取得（FRIENDS公開の判定に使用）
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find((row) => row.startsWith('auth-token='))
      ?.split('=')[1];

    let viewerId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        viewerId = decoded.userId;
      } catch (e) {
        // トークン無効でも続行（未認証として扱う）
        viewerId = null;
      }
    }

    // ユーザーの投稿を取得（承認状態に関係なく取得し、表示条件はサーバー側でフィルタリング）
    const posts = await prisma.post.findMany({
      where: { userId },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        postedAt: true,
        votingEndedAt: true,
        visibilityScope: true,
        visibilityDurationMinutes: true,
        isApproved: true,
        rejectedAt: true,
      },
      orderBy: { postedAt: 'desc' },
      take: 50,
    });

    // 各投稿の投票数は別クエリで取得（Prisma の select 型制約を回避）
    const postIds = posts.map((p) => p.id);
    let voteCountsMap: Record<string, number> = {};
    if (postIds.length > 0) {
      const grouped = await prisma.vote.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true },
      });
      grouped.forEach((g) => {
        voteCountsMap[g.postId] = g._count.id;
      });
    }

    // --- デバッグログ: viewerId と各投稿の投票状態を出力（要検証時のみ） ---
    try {
      posts.forEach((post) => {
        const totalVotes = voteCountsMap[post.id] || 0;
        const votingEndsAt = (post as any).votingEndedAt
          ? new Date((post as any).votingEndedAt).toISOString()
          : null;
        const postedAt = (post as any).postedAt
          ? new Date((post as any).postedAt).toISOString()
          : null;
        const isRejected = !!post.rejectedAt;
        const isApproved = !!post.isApproved;
        const postedAtMs = post.postedAt ? new Date(post.postedAt).getTime() : 0;
        const postedTimeoutExpired = Date.now() >= postedAtMs + 60 * 60 * 1000;
        const votingClosed =
          totalVotes >= 10 ||
          (votingEndsAt != null && new Date(votingEndsAt).getTime() <= Date.now()) ||
          postedTimeoutExpired;
        const isVotingOpen = !isRejected && !isApproved && !votingClosed;
        console.log(
          `[user-posts-debug] viewer=${viewerId} post=${post.id} totalVotes=${totalVotes} votingEndedAt=${votingEndsAt} postedAt=${postedAt} isApproved=${isApproved} rejectedAt=${post.rejectedAt} isVotingOpen=${isVotingOpen}`,
        );
      });
    } catch (e) {
      console.warn('user-posts-debug logging failed', e);
    }

    // 閲覧者が対象ユーザーのフレンドかどうかを判定（FRIENDS公開の取扱い用）
    let isViewerFriend = false;
    if (viewerId && viewerId !== userId) {
      const rel = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: viewerId },
            { userId: viewerId, friendId: userId },
          ],
        },
      });
      isViewerFriend = !!rel;
    }

    const now = Date.now();
    const filtered = posts.filter((post) => {
      // 投票中の投稿は投稿者本人のみ表示。
      // 投票期間の判定条件（投票中である = 非表示対象）:
      // - 投稿が未承認かつ未却下である
      // - かつ以下のいずれかが満たされる: votingEndedAt が未設定 or 将来、投稿作成から1時間未満、投票数が10未満
      const isRejected = !!post.rejectedAt;
      const isApproved = !!post.isApproved;
      const votingEndsAt = (post as any).votingEndedAt
        ? new Date((post as any).votingEndedAt).getTime()
        : null;
      const postedAtMs = new Date(post.postedAt).getTime();
      const postedTimeoutExpired = now >= postedAtMs + 60 * 60 * 1000;
      const totalVotes = voteCountsMap[post.id] || 0;

      const votingClosed =
        totalVotes >= 10 || (votingEndsAt != null && votingEndsAt <= now) || postedTimeoutExpired;
      const isVotingOpen = !isRejected && !isApproved && !votingClosed;
      if (isVotingOpen) {
        if (viewerId === userId) return true;
        return false;
      }

      const duration: number | null = (post as any).visibilityDurationMinutes;

      // 却下済み投稿は表示期間内のみ表示
      if (post.rejectedAt) {
        if (duration == null) return false;
        const withinDuration = new Date(post.postedAt).getTime() >= now - duration * 60 * 1000;
        if (!withinDuration) return false;
      }

      // 表示期間の判定（期間なしは無制限表示）
      if (duration != null) {
        const withinDuration = new Date(post.postedAt).getTime() >= now - duration * 60 * 1000;
        if (!withinDuration) return false;
      }

      // FRIENDS公開は閲覧者がフレンドか本人のみ表示
      if ((post as any).visibilityScope === 'FRIENDS') {
        if (viewerId === userId) return true; // 自分のプロフィールなら見せる
        return isViewerFriend;
      }

      // PUBLICは表示
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 });
  }
}
