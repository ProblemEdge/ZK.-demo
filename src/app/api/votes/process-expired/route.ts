import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // 5分以上前の承認待ち投稿を取得
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const expiredPosts = await prisma.post.findMany({
      where: {
        isApproved: false,
        postedAt: {
          lte: fiveMinutesAgo
        }
      },
      include: {
        votes: {
          select: {
            voteType: true
          }
        }
      }
    });

    let deletedCount = 0;
    let approvedCount = 0;

    for (const post of expiredPosts) {
      const approveCount = post.votes.filter(v => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter(v => v.voteType === 'reject').length;

      // 投票0の場合は削除
      if (approveCount === 0 && rejectCount === 0) {
        await prisma.post.delete({
          where: { id: post.id }
        });
        deletedCount++;
      } else {
        // 多数決を取る（同数の場合は承認）
        const shouldApprove = approveCount >= rejectCount;
        
        await prisma.post.update({
          where: { id: post.id },
          data: {
            isApproved: shouldApprove,
            approvalScore: approveCount
          }
        });

        if (shouldApprove) {
          approvedCount++;
        } else {
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      message: '投票期限切れ処理完了',
      processedCount: expiredPosts.length,
      approvedCount,
      deletedCount
    });

  } catch (error) {
    console.error('Vote expiration process error:', error);
    return NextResponse.json(
      { error: '処理に失敗しました' },
      { status: 500 }
    );
  }
}
