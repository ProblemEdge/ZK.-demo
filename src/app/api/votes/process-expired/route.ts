import { NextResponse } from 'next/server';
import { checkAndUpdateLevel } from '../../utils/level';
import { REWARD_CONFIG } from '../../utils/rewards';
import { sendNotificationToUser } from '../../utils/notifications';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary設定（upload と同様）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // 承認待ちの投稿を全て取得（まだ投票終了処理されていないもののみ）
    const pendingPosts = await prisma.post.findMany({
      where: {
        isApproved: false,
        votingEndedAt: null, // 投票終了処理されていないもののみ
      },
      include: {
        votes: {
          select: {
            voteType: true,
          },
        },
        user: true,
      },
    });

    // 承認済みで公開期限切れの投稿を取得
    const approvedPosts = await prisma.post.findMany({
      where: {
        isApproved: true,
        visibilityDurationMinutes: { not: null },
      },
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

      const approveCount = post.votes.filter((v) => v.voteType === 'approve').length;
      const rejectCount = post.votes.filter((v) => v.voteType === 'reject').length;

      // 投票0の場合は却下として削除
      if (approveCount === 0 && rejectCount === 0) {
        // 削除関数
        await (async () => {
          try {
            // 通知
            await sendNotificationToUser(
              post.userId,
              '⚠️ 投稿の投票が成立しませんでした',
              `投票数が不足したため、投稿は削除されました。`,
              '/post',
              undefined,
              'POST_REJECTED',
            );

            // 関連データ削除とメディア削除（同時に streak をリセット）
            await prisma.$transaction([
              prisma.like.deleteMany({ where: { postId: post.id } }),
              prisma.vote.deleteMany({ where: { postId: post.id } }),
              prisma.comment.deleteMany({ where: { postId: post.id } }),
              prisma.report.deleteMany({ where: { postId: post.id } }),
              prisma.user.update({ where: { id: post.userId }, data: { currentStreak: 0 } }),
              prisma.post.delete({ where: { id: post.id } }),
            ]);

            // 画像削除（Cloudinary or local）
            if (post.imageUrl) {
              // Cloudinary URL の場合は public_id を推定して削除
              if (post.imageUrl.includes('res.cloudinary.com')) {
                try {
                  const idx = post.imageUrl.indexOf('/upload/');
                  if (idx !== -1) {
                    let after = post.imageUrl.substring(idx + '/upload/'.length);
                    // v{number}/ を取り除く
                    after = after.replace(/^v\d+\//, '');
                    const publicId = after.replace(/\.[^/.]+$/, '');
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                  }
                } catch (e) {
                  console.warn('Cloudinary画像削除失敗', e);
                }
              } else if (post.imageUrl.startsWith('/uploads')) {
                try {
                  const p = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
                  await fs.unlink(p).catch(() => {});
                } catch (e) {
                  console.warn('ローカル画像削除失敗', e);
                }
              }
            }
          } catch (e) {
            console.error('投稿削除処理でエラー', e);
          }
        })();

        deletedCount++;
        continue;
      } else {
        // 多数決を取る（同数の場合は承認）
        const shouldApprove = approveCount >= rejectCount;

        if (shouldApprove) {
          const updatedPost = await prisma.$transaction(async (tx) => {
            const p = await tx.post.update({
              where: { id: post.id },
              data: {
                isApproved: true,
                approvalScore: approveCount,
                votingEndedAt: new Date(),
                rejectedAt: null,
              },
            });

            // 原子的に streak を更新し、報酬を付与する
            await tx.$executeRaw`
              UPDATE "User"
              SET "currentStreak" = "currentStreak" + 1,
                  "maxStreak" = GREATEST("maxStreak", "currentStreak" + 1)
              WHERE "id" = ${p.userId}
            `;

            await tx.user.update({
              where: { id: p.userId },
              data: {
                gems: { increment: REWARD_CONFIG.postApproved.gems },
                experience: { increment: REWARD_CONFIG.postApproved.exp },
              },
            });

            return p;
          });

          // 成功通知を送信
          await sendNotificationToUser(
            updatedPost.userId,
            '✅ 投稿が承認されました！',
            `投稿が投票に合格し、公開されました。${REWARD_CONFIG.postApproved.gems} 💎 と ${REWARD_CONFIG.postApproved.exp} ⭐ を獲得！`,
            `/post/${updatedPost.id}`,
            undefined,
            'POST_APPROVED',
          );

          // クエスト投稿の場合、進行状況を更新
          if ((post as any).questId) {
            await prisma.userQuestProgress.upsert({
              where: {
                userId_questId: {
                  userId: post.userId,
                  questId: (post as any).questId,
                },
              },
              create: {
                userId: post.userId,
                questId: (post as any).questId,
                completed: true,
                completedAt: new Date(),
              },
              update: {
                completed: true,
                completedAt: new Date(),
              },
            });

            await prisma.user.update({
              where: { id: updatedPost.userId },
              data: {
                gems: { increment: REWARD_CONFIG.questBonus.gems },
                completedQuestsCount: { increment: 1 },
                experience: { increment: REWARD_CONFIG.questBonus.exp },
              },
            });
          }

          // レベルアップ判定
          await checkAndUpdateLevel(updatedPost.userId);

          approvedCount++;
        } else {
          // 失敗通知を送信して完全削除
          try {
            await sendNotificationToUser(
              post.userId,
              '❌ 投稿が却下されました',
              `投稿が投票に不合格となったため削除されました。次の投稿に挑戦してください！`,
              '/post',
              undefined,
              'POST_REJECTED',
            );

            await prisma.$transaction([
              prisma.like.deleteMany({ where: { postId: post.id } }),
              prisma.vote.deleteMany({ where: { postId: post.id } }),
              prisma.comment.deleteMany({ where: { postId: post.id } }),
              prisma.report.deleteMany({ where: { postId: post.id } }),
              prisma.user.update({ where: { id: post.userId }, data: { currentStreak: 0 } }),
              prisma.post.delete({ where: { id: post.id } }),
            ]);

            // メディア削除
            if (post.imageUrl) {
              if (post.imageUrl.includes('res.cloudinary.com')) {
                try {
                  const idx = post.imageUrl.indexOf('/upload/');
                  if (idx !== -1) {
                    let after = post.imageUrl.substring(idx + '/upload/'.length);
                    after = after.replace(/^v\d+\//, '');
                    const publicId = after.replace(/\.[^/.]+$/, '');
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                  }
                } catch (e) {
                  console.warn('Cloudinary画像削除失敗', e);
                }
              } else if ((post as any).imageUrl.startsWith('/uploads')) {
                try {
                  const p = path.join(
                    process.cwd(),
                    'public',
                    (post as any).imageUrl.replace(/^\//, ''),
                  );
                  await fs.unlink(p).catch(() => {});
                } catch (e) {
                  console.warn('ローカル画像削除失敗', e);
                }
              }
            }

            deletedCount++;
          } catch (e) {
            console.error('却下処理での削除エラー', e);
          }
        }
      }
    }

    // 承認後の公開期限切れ処理
    for (const post of approvedPosts) {
      const duration = (post as any).visibilityDurationMinutes;
      if (duration === null) continue;
      // 投票の5分が終了した時刻（承認処理が走るタイミング）からカウントするため、
      // possible voting end timestamp を優先的に使用し、なければ updatedAt、最終手段で postedAt を使用する
      const approvalTime = (post as any).votingEndedAt
        ? new Date((post as any).votingEndedAt).getTime()
        : (post as any).updatedAt
          ? new Date((post as any).updatedAt).getTime()
          : new Date(post.postedAt).getTime();

      // ユーザーが設定した公開期間に加えて +5分（投票時間分）の猶予を追加してカウント開始
      const expiryTime = approvalTime + duration * 60 * 1000 + 5 * 60 * 1000;

      if (now >= expiryTime) {
        // 期間終了 → 完全削除（関連データ＋メディア）
        try {
          await prisma.$transaction([
            prisma.like.deleteMany({ where: { postId: post.id } }),
            prisma.vote.deleteMany({ where: { postId: post.id } }),
            prisma.comment.deleteMany({ where: { postId: post.id } }),
            prisma.report.deleteMany({ where: { postId: post.id } }),
            prisma.post.delete({ where: { id: post.id } }),
          ]);

          // 画像削除
          if ((post as any).imageUrl) {
            const imageUrl = (post as any).imageUrl as string;
            if (imageUrl.includes('res.cloudinary.com')) {
              try {
                const idx = imageUrl.indexOf('/upload/');
                if (idx !== -1) {
                  let after = imageUrl.substring(idx + '/upload/'.length);
                  after = after.replace(/^v\d+\//, '');
                  const publicId = after.replace(/\.[^/.]+$/, '');
                  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                }
              } catch (e) {
                console.warn('Cloudinary画像削除失敗', e);
              }
            } else if (imageUrl.startsWith('/uploads')) {
              try {
                const p = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
                await fs.unlink(p).catch(() => {});
              } catch (e) {
                console.warn('ローカル画像削除失敗', e);
              }
            }
          }

          deletedCount++;
        } catch (e) {
          console.error('承認後の削除処理エラー', e);
        }
      }
    }

    return NextResponse.json({
      message: '投票期限切れ処理完了',
      processedCount: deletedCount + approvedCount,
      approvedCount,
      deletedCount,
    });
  } catch (error) {
    console.error('Vote expiration process error:', error);
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
  }
}
