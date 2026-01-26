import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
    const posts = await prisma.post.findMany({
      where: {
        isApproved: false
      },
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
          select: {
            voteType: true,
            voterId: true
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 50
    });

    // 投票の割合を計算
    const postsWithVoteCount = posts.map(post => {
      const approveCount = post.votes.filter(v => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter(v => v.voteType === 'reject').length;
      const totalVotes = approveCount + rejectCount;
      
      // 現在のユーザーが投票済みかチェック
      const hasVoted = currentUserId ? post.votes.some(v => v.voterId === currentUserId) : false;

      return {
        ...post,
        votes: undefined,
        approveCount,
        rejectCount,
        totalVotes,
        approvePercentage: totalVotes > 0 ? Math.round((approveCount / totalVotes) * 100) : 0,
        hasVoted
      };
    });

    return NextResponse.json(postsWithVoteCount);

  } catch (error) {
    console.error('Get pending posts error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}