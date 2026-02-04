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
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    // フレンド一覧を取得
    const friendsList = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: decoded.userId },
          { friendId: decoded.userId }
        ]
      },
      select: { userId: true, friendId: true }
    });
    const friendIds = friendsList.map(f => 
      f.userId === decoded.userId ? f.friendId : f.userId
    );
    const allowedIds = [decoded.userId, ...friendIds];

    let approvedWhereClause: any = {
      isApproved: true,
      OR: [
        { visibilityScope: 'PUBLIC' },
        { AND: [ { visibilityScope: 'FRIENDS' }, { userId: { in: allowedIds } } ] }
      ]
    };

    const votingWhereClause: any = {
      isApproved: false
    };

    if (tab === 'following') {
      // フレンドタブでは自分+フレンドのみ表示
      approvedWhereClause = { isApproved: true, userId: { in: allowedIds } };
      votingWhereClause.userId = { in: allowedIds };
    }

    // 承認済み投稿と投票中の投稿を並列取得（高速化）
    const [approvedPosts, votingPosts] = await Promise.all([
      prisma.post.findMany({
        where: approvedWhereClause,
        select: {
          id: true,
          userId: true,
          imageUrl: true,
          title: true,
          caption: true,
          tags: true,
          postedAt: true,
          approvalScore: true,
          visibilityScope: true,
          visibilityDurationMinutes: true,
          latitude: true,
          longitude: true,
          locationName: true,
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
            where: { voterId: decoded.userId },
            select: { voteType: true }
          },
          likes: {
            where: { userId: decoded.userId },
            select: { id: true }
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              votes: true
            }
          }
        },
        orderBy: {
          postedAt: 'desc'
        },
        skip: skip,
        take: limit
      }),
      prisma.post.findMany({
        where: votingWhereClause,
        select: {
          id: true,
          userId: true,
          imageUrl: true,
          title: true,
          caption: true,
          tags: true,
          postedAt: true,
          approvalScore: true,
          visibilityScope: true,
          visibilityDurationMinutes: true,
          latitude: true,
          longitude: true,
          locationName: true,
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
            where: { voterId: decoded.userId },
            select: { voteType: true }
          },
          likes: {
            where: { userId: decoded.userId },
            select: { id: true }
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              votes: true
            }
          }
        },
        orderBy: {
          postedAt: 'desc'
        },
        skip: 0,
        take: 5
      })
    ]);

    // 投票統計を並列取得
    const votingPostIds = votingPosts.map(p => p.id);
    const approvedPostIds = approvedPosts.map(p => p.id);
    
    const [voteStats, approvedVoteStats] = await Promise.all([
      votingPostIds.length > 0 ? prisma.vote.groupBy({
        by: ['postId', 'voteType'],
        where: { postId: { in: votingPostIds } },
        _count: { id: true }
      }) : Promise.resolve([]),
      approvedPostIds.length > 0 ? prisma.vote.groupBy({
        by: ['postId', 'voteType'],
        where: { postId: { in: approvedPostIds } },
        _count: { id: true }
      }) : Promise.resolve([])
    ]);

    // 投票カウントを追加
    // 投票中投稿: 公開範囲・公開期間を適用し、匿名化
    const enrichedVotingPosts = votingPosts
      .filter((post) => {
        if ((post as any).visibilityScope === 'FRIENDS') {
          return allowedIds.includes((post as any).userId);
        }
        return true;
      })
      .map((post: typeof votingPosts[number]) => {
        // voteStatsから承認/却下数を取得
        const approveCount = voteStats.find(v => v.postId === post.id && v.voteType === 'approve')?._count.id || 0;
        const rejectCount = voteStats.find(v => v.postId === post.id && v.voteType === 'reject')?._count.id || 0;
        const hasVoted = post.votes.length > 0;
        const hasLiked = post.likes.length > 0;
        const totalVotes = post._count.votes;
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
          likeCount: post._count.likes,
          hasLiked,
          commentCount: post._count.comments
        } as any;

        // 投票中は匿名、終了後は実ユーザーを表示
        if (!isVotingClosed) {
          base.user = { id: 'anonymous', username: 'anonymous', displayName: null, avatarUrl: null } as any;
        }

        // votesとlikesの生データは削除（不要なデータを送らない）
        delete base.votes;
        delete base.likes;

        return base;
      })
      .filter((p) => p);

    const enrichedApprovedPosts = approvedPosts
      .map((post: typeof approvedPosts[number]) => {
        const duration: any = (post as any).visibilityDurationMinutes;
        const withinDuration = duration == null || (new Date(post.postedAt).getTime() >= (Date.now() - duration * 60 * 1000));
        if (!withinDuration) return null as any;

      const approveCount = approvedVoteStats.find(v => v.postId === post.id && v.voteType === 'approve')?._count.id || 0;
      const rejectCount = approvedVoteStats.find(v => v.postId === post.id && v.voteType === 'reject')?._count.id || 0;
      const hasLiked = post.likes.length > 0;
      
      // votesとlikesの生データは削除（不要なデータを送らない）
      const result = {
        ...post,
        approveCount,
        rejectCount,
        totalVotes: post._count.votes,
        hasVoted: false,
        likeCount: post._count.likes,
        hasLiked,
        commentCount: post._count.comments
      };
      delete (result as any).votes;
      delete (result as any).likes;
      
      return result;
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
