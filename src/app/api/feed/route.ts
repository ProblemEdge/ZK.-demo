import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'all';

    // フォロー中のユーザー一覧を一度だけ取得
    const followingList = await prisma.follow.findMany({
      where: { followerId: decoded.userId },
      select: { followingId: true }
    });
    const followingIds = followingList.map((f: { followingId: string }) => f.followingId);
    const allowedIds = [decoded.userId, ...followingIds];

    let approvedWhereClause: any = {
      isApproved: true,
      OR: [
        { visibilityScope: 'PUBLIC' },
        { AND: [ { visibilityScope: 'FOLLOWERS' }, { userId: { in: allowedIds } } ] }
      ]
    };

    let votingWhereClause: any = {
      isApproved: false
    };

    if (tab === 'following') {
      // フォロー中タブでは自分+フォロー中のみ表示
      approvedWhereClause = { isApproved: true, userId: { in: allowedIds } };
      votingWhereClause.userId = { in: allowedIds };
    }

    // 承認済み投稿を取得
    const approvedPosts = await prisma.post.findMany({
      where: approvedWhereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true
          }
        },
        votes: {
          select: { voteType: true, voterId: true }
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
      take: 5
    });

    // 投票中の投稿を取得
    const votingPosts = await prisma.post.findMany({
      where: votingWhereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true
          }
        },
        votes: {
          select: { voteType: true, voterId: true }
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
      take: 5
    });

    // 投票カウントを追加
    // 投票中投稿: 公開範囲・公開期間を適用し、匿名化
    const enrichedVotingPosts = votingPosts
      .filter((post) => {
        if ((post as any).visibilityScope === 'FOLLOWERS') {
          return allowedIds.includes((post as any).userId);
        }
        return true;
      })
      .map((post: typeof votingPosts[number]) => {
        const approveCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'approve').length;
        const rejectCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'reject').length;
        const hasVoted = post.votes.some((v: { voterId: string }) => v.voterId === decoded.userId);
        const hasLiked = post.likes.some((l: { userId: string }) => l.userId === decoded.userId);
        const totalVotes = post.votes.length;
        const duration: any = (post as any).visibilityDurationMinutes;
        const withinDuration = duration == null || (new Date(post.postedAt).getTime() >= (Date.now() - duration * 60 * 1000));
        if (!withinDuration) return null as any;

        const isVotingClosed = totalVotes >= 10 || new Date(post.postedAt).getTime() < (Date.now() - 5 * 60 * 1000);
        const base = {
          ...post,
          approveCount,
          rejectCount,
          totalVotes,
          hasVoted,
          likeCount: post.likes.length,
          hasLiked,
          commentCount: post._count.comments
        } as any;

        // 投票中は匿名、終了後は実ユーザーを表示
        if (!isVotingClosed) {
          base.user = { id: 'anonymous', username: 'anonymous', displayName: null, avatarUrl: null } as any;
        }

        return base;
      })
      .filter((p) => p);

    const enrichedApprovedPosts = approvedPosts
      .map((post: typeof approvedPosts[number]) => {
        const duration: any = (post as any).visibilityDurationMinutes;
        const withinDuration = duration == null || (new Date(post.postedAt).getTime() >= (Date.now() - duration * 60 * 1000));
        if (!withinDuration) return null as any;

      const approveCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter((v: { voteType: string }) => v.voteType === 'reject').length;
      const hasLiked = post.likes.some((l: { userId: string }) => l.userId === decoded.userId);
      return {
        ...post,
        approveCount,
        rejectCount,
        totalVotes: post.votes.length,
        hasVoted: false,
        likeCount: post.likes.length,
        hasLiked,
        commentCount: post._count.comments
        };
      })
      .filter((p) => p);

    return NextResponse.json({ approved: enrichedApprovedPosts, voting: enrichedVotingPosts });

  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'フィード取得に失敗しました' },
      { status: 500 }
    );
  }
}
