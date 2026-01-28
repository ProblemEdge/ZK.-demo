import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkAndUpdateLevel } from '../../utils/level';
import { REWARD_CONFIG, getExpForLevel } from '../../utils/rewards';
import { sendNotificationToUser } from '../../utils/notifications';

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

    // 自分の投稿かチェック
    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, questId: true }
    });

    if (!targetPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    if (targetPost.userId === decoded.userId) {
      return NextResponse.json(
        { error: '自分の投稿には投票できません' },
        { status: 403 }
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

    // 投票受付中かチェック（votingEndedAt が設定されていない or 未来の場合のみOK）
    const postWithVotingStatus = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (postWithVotingStatus?.votingEndedAt && postWithVotingStatus.votingEndedAt <= new Date()) {
      return NextResponse.json(
        { error: 'この投稿の投票受付は終了しました' },
        { status: 410 }
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

    // 投票者にジェムと経験値を付与
    const updatedVoter = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        gems: { increment: REWARD_CONFIG.vote.gems },
        experience: { increment: REWARD_CONFIG.vote.exp }
      }
    });

    // レベルをチェック
    await checkAndUpdateLevel(decoded.userId);

    // 投稿者にもジェムと経験値を付与（投票が集まったことへの報酬）
    const postAuthor = await prisma.user.update({
      where: { id: targetPost.userId },
      data: {
        gems: { increment: REWARD_CONFIG.vote.gems },
        experience: { increment: REWARD_CONFIG.vote.exp }
      }
    });

    // 投稿者のレベルもチェック
    await checkAndUpdateLevel(targetPost.userId);

    // 投稿者に投票された通知を送信（投票中は匿名）
    await sendNotificationToUser(
      targetPost.userId,
      '🗳️ 投稿に投票されました！',
      `あなたの投稿に投票が集まりました。${REWARD_CONFIG.vote.gems} ジェムを獲得しました！`,
      `/feed`,
      undefined, // 投票中は投票者を匿名化
      'POST_CREATED'
    );

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

    // 投票受け付け開始から5分経過したかチェック
    const postCreatedTime = (await prisma.post.findUnique({
      where: { id: postId },
      select: { postedAt: true }
    }))?.postedAt || new Date();
    
    const fiveMinutesLater = new Date(postCreatedTime.getTime() + 5 * 60 * 1000);
    const isTimedOut = new Date() >= fiveMinutesLater;

    // 10票に達した or 5分経過で投票終了
    let isComplete = false;
    if (totalVotes >= 10 || isTimedOut) {
      isComplete = true;
      
      // OKがNGより多い場合のみ承認（同数や0票の場合は却下）
      const shouldApprove = approveCount > rejectCount;
      
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          isApproved: shouldApprove,
          rejectedAt: shouldApprove ? null : new Date(),
          approvalScore: approveCount,
          votingEndedAt: new Date()
        },
        include: {
          user: true,
          quest: true // クエスト情報も取得
        }
      });

      // 投稿者に通知を送信
      if (shouldApprove) {
        await sendNotificationToUser(
          updatedPost.userId,
          '✅ 投稿が承認されました！',
          '投票で承認され、あなたの投稿は公開されました',
          `/feed`,
          undefined,
          'POST_APPROVED'
        );
      } else {
        await sendNotificationToUser(
          updatedPost.userId,
          '❌ 投稿が却下されました',
          '申し訳ありません。投票で却下されました',
          `/post`,
          undefined,
          'POST_REJECTED'
        );
      }

      // 승인된 경우のみ、投稿者にボーナス報酬
      if (shouldApprove) {
        await prisma.user.update({
          where: { id: updatedPost.userId },
          data: {
            gems: { increment: REWARD_CONFIG.postApproved.gems },
            experience: { increment: REWARD_CONFIG.postApproved.exp }
          }
        });

        // クエスト投稿なら進行状況を更新（承認時）
        if (updatedPost.questId) {
          await prisma.userQuestProgress.upsert({
            where: {
              userId_questId: {
                userId: updatedPost.userId,
                questId: updatedPost.questId
              }
            },
            create: {
              userId: updatedPost.userId,
              questId: updatedPost.questId,
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

        // 投稿者のレベルをチェック
        await checkAndUpdateLevel(updatedPost.userId);

        // 承認時の通知を送信
        await sendNotificationToUser(
          updatedPost.userId,
          updatedPost.questId ? '🎉 クエスト完了！' : '✅ 投稿が承認されました！',
          updatedPost.questId 
            ? `投票結果: ${approveCount}承認 vs ${rejectCount}却下 - クエストボーナス獲得！`
            : `投票結果: ${approveCount}承認 vs ${rejectCount}却下`,
          `/post?id=${postId}`,
          undefined,
          'POST_APPROVED'
        );
      } else {
        // 却下された場合、クエスト投稿なら進行状況をリセット
        if (updatedPost.questId) {
          // 他の未承認の投稿がないかチェック
          const otherPendingPosts = await prisma.post.findFirst({
            where: {
              userId: updatedPost.userId,
              questId: updatedPost.questId,
              isApproved: false,
              id: { not: postId }
            }
          });

          // 他の未承認投稿がなければ進行中フラグをクリア
          if (!otherPendingPosts) {
            await prisma.userQuestProgress.update({
              where: {
                userId_questId: {
                  userId: updatedPost.userId,
                  questId: updatedPost.questId
                }
              },
              data: {
                completed: false
              }
            });
          }
        }

        // 却下時の通知を送信
        await sendNotificationToUser(
          updatedPost.userId,
          '❌ 投稿が却下されました',
          `投票結果: ${approveCount}承認 vs ${rejectCount}却下 - 次回頑張りましょう！`,
          `/post?id=${postId}`,
          undefined,
          'POST_REJECTED'
        );
      }
    }

    // 投票完了時に投稿者の報酬データを返す
    let authorRewardData = null;
    if (isComplete) {
      const authorData = await prisma.user.findUnique({
        where: { id: targetPost.userId },
        select: {
          level: true,
          experience: true,
          gems: true
        }
      });

      if (authorData) {
        const shouldApprove = approveCount > rejectCount;
        const expToNextLevel = getExpForLevel(authorData.level);
        
        if (shouldApprove) {
          // 成功時の報酬
          const baseReward = REWARD_CONFIG.postApproved.gems;
          const baseExp = REWARD_CONFIG.postApproved.exp;
          let totalGems = baseReward;
          let totalExp = baseExp;

          // クエスト投稿の場合はボーナス追加
          if (targetPost.questId) {
            totalGems += REWARD_CONFIG.questBonus.gems;
            totalExp += REWARD_CONFIG.questBonus.exp;
          }

          // 報酬前の値を計算
          const gemsBeforeReward = (authorData.gems || 0) - totalGems;
          const expBeforeReward = (authorData.experience || 0) - totalExp;

          authorRewardData = {
            gems: totalGems,
            gemsBefore: gemsBeforeReward,
            gemsAfter: authorData.gems || 0,
            exp: totalExp,
            currentExp: expBeforeReward,
            currentExpAfter: authorData.experience || 0,
            expToNextLevel,
            level: authorData.level || 1,
            message: targetPost.questId ? '✅ クエスト完了！ボーナス報酬をゲット！' : '✅ 投稿が承認されました！報酬をゲット！',
            approved: true
          };
        } else {
          // 失敗時は報酬なし
          authorRewardData = {
            approved: false,
            message: '❌ 投票結果：却下'
          };
        }
      }
    }

    // 報酬情報を取得
    const voterData = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        level: true,
        experience: true,
        gems: true
      }
    });

    const authorData = await prisma.user.findUnique({
      where: { id: targetPost.userId },
      select: {
        level: true,
        experience: true,
        gems: true
      }
    });

    const expToNextLevelVoter = voterData ? getExpForLevel(voterData.level) : 50;
    const expToNextLevelAuthor = authorData ? getExpForLevel(authorData.level) : 50;

    // 追加前の値を計算
    const voterGemsBeforeReward = (voterData?.gems || 0) - REWARD_CONFIG.vote.gems;
    const voterExpBeforeReward = (voterData?.experience || 0) - REWARD_CONFIG.vote.exp;
    const authorGemsBeforeReward = (authorData?.gems || 0) - REWARD_CONFIG.vote.gems;
    const authorExpBeforeReward = (authorData?.experience || 0) - REWARD_CONFIG.vote.exp;

    return NextResponse.json({
      message: '投票しました',
      vote,
      approveCount,
      rejectCount,
      isComplete,
      approved: approveCount >= rejectCount && isComplete,
      reward: {
        gems: REWARD_CONFIG.vote.gems,
        gemsBefore: voterGemsBeforeReward,
        gemsAfter: voterData?.gems || 0,
        exp: REWARD_CONFIG.vote.exp,
        currentExp: voterExpBeforeReward,
        currentExpAfter: voterData?.experience || 0,
        expToNextLevel: expToNextLevelVoter,
        level: voterData?.level || 1,
        message: '投票に参加しました！'
      },
      authorReward: authorRewardData // 投稿者の報酬情報
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: '投票に失敗しました' },
      { status: 500 }
    );
  }
}