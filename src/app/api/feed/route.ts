import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // 投票中の投稿の条件（5分以内かつ未承認）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    let approvedWhereClause: any = {
      isApproved: true
    };

    let votingWhereClause: any = {
      isApproved: false,
      postedAt: { gte: fiveMinutesAgo }
    };

    if (tab === 'following') {
      const followingList = await prisma.follow.findMany({
        where: { followerId: decoded.userId },
        select: { followingId: true }
      });

      const followingIds = followingList.map(f => f.followingId);
      
      if (followingIds.length === 0) {
        // フォロー中のユーザーがいない場合は空配列を返す
        return NextResponse.json({ approved: [], voting: [] });
      }

      approvedWhereClause.userId = { in: followingIds };
      votingWhereClause.userId = { in: followingIds };
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
      take: 50
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
      take: 50
    });

    // 投票カウントを追加
    const enrichedVotingPosts = votingPosts.map(post => {
      const approveCount = post.votes.filter(v => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter(v => v.voteType === 'reject').length;
      const hasVoted = post.votes.some(v => v.voterId === decoded.userId);
      const hasLiked = post.likes.some(l => l.userId === decoded.userId);
      return {
        ...post,
        approveCount,
        rejectCount,
        totalVotes: post.votes.length,
        hasVoted,
        likeCount: post.likes.length,
        hasLiked,
        commentCount: post._count.comments
      };
    });

    const enrichedApprovedPosts = approvedPosts.map(post => {
      const approveCount = post.votes.filter(v => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter(v => v.voteType === 'reject').length;
      const hasLiked = post.likes.some(l => l.userId === decoded.userId);
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
    });

    return NextResponse.json({ approved: enrichedApprovedPosts, voting: enrichedVotingPosts });

  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'フィード取得に失敗しました' },
      { status: 500 }
    );
  }
}
