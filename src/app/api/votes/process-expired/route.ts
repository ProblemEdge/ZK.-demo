import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAndUpdateLevel } from '../../utils/level';
import { REWARD_CONFIG } from '../../utils/rewards';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    // 承認待ちの投稿を全て取得
    const pendingPosts = await prisma.post.findMany({
      where: {
        isApproved: false
      },
      include: {
        votes: {
          select: {
            voteType: true
          }
        },
        user: true
      }
    });

    // 承認済みで公開期限切れの投稿を取得
    const approvedPosts = await prisma.post.findMany({
      where: {
        isApproved: true,
        visibilityDurationMinutes: { not: null }
      }
    });

    let deletedCount = 0;
    let approvedCount = 0;

    // 投票期限切れ処理（5分固定）
    for (const post of pendingPosts) {
      const postTime = new Date(post.postedAt).getTime();
      
      // 投票期限は5分固定
      if (postTime >= fiveMinutesAgo) {
        continue; // まだ投票期限内
      }

      const approveCount = post.votes.filter(v => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter(v => v.voteType === 'reject').length;

      // 投票0の場合は却下として終了
      if (approveCount === 0 && rejectCount === 0) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            isApproved: false,
            rejectedAt: new Date(),
            approvalScore: 0,
            votingEndedAt: new Date()
          }
        });
        deletedCount++;
      } else {
        // 多数決を取る（同数の場合は承認）
        const shouldApprove = approveCount >= rejectCount;
        
        if (shouldApprove) {
          const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: {
              isApproved: true,
              approvalScore: approveCount,
              votingEndedAt: new Date(),
              rejectedAt: null
            }
          });

          await prisma.user.update({
            where: { id: updatedPost.userId },
            data: {
              gems: { increment: REWARD_CONFIG.postApproved.gems },
              experience: { increment: REWARD_CONFIG.postApproved.exp }
            }
          });

          // クエスト投稿の場合、進行状況を更新
          if ((post as any).questId) {
            await prisma.userQuestProgress.upsert({
              where: {
                userId_questId: {
                  userId: post.userId,
                  questId: (post as any).questId
                }
              },
              create: {
                userId: post.userId,
                questId: (post as any).questId,
                completed: true,
                completedAt: new Date()
              },
              update: {
                completed: true,
                completedAt: new Date()
              }
            });

            await prisma.user.update({
              where: { id: updatedPost.userId },
              data: {
                gems: { increment: REWARD_CONFIG.questBonus.gems },
                experience: { increment: REWARD_CONFIG.questBonus.exp }
              }
            });
          }

          // レベルアップ判定
          await checkAndUpdateLevel(updatedPost.userId);

          approvedCount++;
        } else {
          // 却下された投稿は削除せず、却下として終了
          await prisma.post.update({
            where: { id: post.id },
            data: {
              isApproved: false,
              rejectedAt: new Date(),
              approvalScore: approveCount,
              votingEndedAt: new Date()
            }
          });
          deletedCount++;
        }
      }
    }

    // 承認後の公開期限切れ処理
    for (const post of approvedPosts) {
      const duration = (post as any).visibilityDurationMinutes;
      if (duration === null) continue;

      // updatedAtがない場合はpostedAtを使用（承認時刻の代わり）
      const approvalTime = (post as any).updatedAt 
        ? new Date((post as any).updatedAt).getTime() 
        : new Date(post.postedAt).getTime();
      
      const expiryTime = approvalTime + (duration * 60 * 1000);
      
      if (now >= expiryTime) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            visibilityDurationMinutes: 0
          }
        });
        deletedCount++;
      }
    }

    return NextResponse.json({
      message: '投票期限切れ処理完了',
      processedCount: deletedCount + approvedCount,
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
