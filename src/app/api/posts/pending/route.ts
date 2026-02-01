import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Cookieからユーザー情報を取得
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    let currentUserId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        currentUserId = decoded.userId;
      } catch {
        // トークン検証失敗時はそのまま続行
      }
    }

    // 承認待ちの投稿を取得（新しい順）
    // 投票受付中（votingEndedAt が null or 未来）の投稿のみ表示
    const now = new Date();
    const posts = await prisma.post.findMany({
      where: {
        isApproved: false,
        rejectedAt: null, // 却下されていない
        OR: [
          { votingEndedAt: null }, // 投票受付中
          { votingEndedAt: { gt: now } } // 投票受付時間が未来
        ]
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        caption: true,
        tags: true,
        postedAt: true,
        rejectedAt: true,
        isApproved: true,
        questId: true,
        visibilityScope: true,
        visibilityDurationMinutes: true,
        votingEndedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        votes: {
          select: {
            voteType: true,
            voterId: true
          }
        },
        likes: {
          select: { userId: true }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 10
    });

    // 投票の割合を計算（5票未満のみ表示）
    // フレンド限定の投稿は、フレンド（または本人）のみ閲覧可能
    let allowedIds: string[] = [];
    if (currentUserId) {
      const friendsList = await prisma.friend.findMany({
        where: {
          OR: [
            { userId: currentUserId },
            { friendId: currentUserId }
          ]
        },
        select: { userId: true, friendId: true }
      });
      allowedIds = friendsList.map(f => 
        f.userId === currentUserId ? f.friendId : f.userId
      );
      allowedIds.push(currentUserId);
    }

    const nowTs = Date.now();

    const postsWithVoteCount = posts
      .filter((post) => {
        // 公開範囲フィルタ
        if ((post as any).visibilityScope === 'FRIENDS') {
          if (!currentUserId) return false;
          return allowedIds.includes((post as any).userId);
        }
        return true;
      })
      .map(post => {
        const approveCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'approve').length;
        const rejectCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'reject').length;
        const totalVotes = approveCount + rejectCount;
        
        // 現在のユーザーが投票済みかチェック
        const hasVoted = currentUserId ? post.votes.some((v: { voterId: string }) => v.voterId === currentUserId) : false;
        const hasLiked = currentUserId && post.likes ? post.likes.some((l: { userId: string }) => l.userId === currentUserId) : false;

        // 投票期限は一律5分
        const fiveMinutesAgo = nowTs - 5 * 60 * 1000;
        const isWithinVotingPeriod = new Date(post.postedAt).getTime() >= fiveMinutesAgo;

        const base = {
          ...post,
          votes: undefined,
          approveCount,
          rejectCount,
          totalVotes,
          approvePercentage: totalVotes > 0 ? Math.round((approveCount / totalVotes) * 100) : 0,
          hasVoted,
          likeCount: post.likes?.length || 0,
          hasLiked,
          commentCount: post._count.comments
        };
        return isWithinVotingPeriod ? base : null;
      })
      .filter((post) => post !== null)
      .filter((post) => (post as any).totalVotes < 5) as any[];  // 5票未満のみ表示

    // 投票中は匿名表示（ユーザー情報を伏せる）
    const anonymized = postsWithVoteCount.map((p) => ({
      ...p,
      user: {
        id: 'anonymous',
        username: 'anonymous',
        displayName: null,
        avatarUrl: null
      }
    }));

    return NextResponse.json(anonymized);

  } catch (error) {
    console.error('Get pending posts error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}