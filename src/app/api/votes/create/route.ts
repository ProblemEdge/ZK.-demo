import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
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

    const { postId, voteType } = await request.json();

    if (!postId || !['approve', 'reject'].includes(voteType)) {
      return NextResponse.json(
        { error: '投票内容が不正です' },
        { status: 400 }
      );
    }

    // 既に投票済みかチェック
    const existingVote = await prisma.vote.findUnique({
      where: {
        postId_voterId: {
          postId,
          voterId: decoded.userId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'この投稿には既に投票済みです' },
        { status: 409 }
      );
    }

    // 投票を作成
    const vote = await prisma.vote.create({
      data: {
        postId,
        voterId: decoded.userId,
        voteType
      }
    });

    // 投票数を集計
    const approveCount = await prisma.vote.count({
      where: {
        postId,
        voteType: 'approve'
      }
    });

    const rejectCount = await prisma.vote.count({
      where: {
        postId,
        voteType: 'reject'
      }
    });

    const totalVotes = approveCount + rejectCount;

    // 5票に達したら投票終了して結果判定
    let isComplete = false;
    if (totalVotes >= 5) {
      isComplete = true;
      
      // 同数の場合は承認、またはapproveが多い場合は承認
      const shouldApprove = approveCount >= rejectCount;
      
      await prisma.post.update({
        where: { id: postId },
        data: {
          isApproved: shouldApprove,
          approvalScore: approveCount
        }
      });
    }

    return NextResponse.json({
      message: '投票しました',
      vote,
      approveCount,
      rejectCount,
      isComplete,
      approved: approveCount >= rejectCount && isComplete
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: '投票に失敗しました' },
      { status: 500 }
    );
  }
}