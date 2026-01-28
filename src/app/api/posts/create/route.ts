import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
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

    const {
      imageUrl,
      caption,
      tags,
      visibilityScope,
      visibilityDuration,
      questId,
      latitude,
      longitude,
      locationName
    } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像は必須です' },
        { status: 400 }
      );
    }

    if (caption.length > 300) {
      return NextResponse.json(
        { error: 'キャプションは300文字以内にしてください' },
        { status: 400 }
      );
    }

    // 1日の投稿上限チェック（ショットトークン: 1日5回、0時リセット）
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayCount = await prisma.post.count({
      where: {
        userId: decoded.userId,
        postedAt: { gte: startOfToday }
      }
    });

    const limitPerDay = 5;
    if (todayCount >= limitPerDay) {
      return NextResponse.json(
        { error: `本日の投稿可能回数は${limitPerDay}回です。0時にリセットされます。` },
        { status: 429 }
      );
    }

    // クエスト投稿が進行中かチェック（同じクエストの重複投稿を防止）
    if (questId) {
      const existingPendingQuest = await prisma.post.findFirst({
        where: {
          userId: decoded.userId,
          questId,
          isApproved: false
        }
      });

      if (existingPendingQuest) {
        return NextResponse.json(
          { error: 'このクエストは現在進行中です。結果が出るまでお待ちください。' },
          { status: 409 }
        );
      }
    }

    // 公開範囲（デフォルトはフォロワーのみ）
    const scope = visibilityScope === 'PUBLIC' ? 'PUBLIC' : 'FOLLOWERS';

    // 公開期間（分）。'unlimited' なら null、数字なら最低5分。デフォルトは24時間(1440分)
    let visibilityDurationMinutes: number | null = null;
    if (visibilityDuration === 'unlimited') {
      visibilityDurationMinutes = null;
    } else if (typeof visibilityDuration === 'number') {
      const minutes = Math.max(5, visibilityDuration);
      visibilityDurationMinutes = minutes;
    } else {
      // 既定値: 1440分（24h）
      visibilityDurationMinutes = 1440;
    }

    // 位置情報（任意）
    const latitudeNum = typeof latitude === 'number' ? latitude : null;
    const longitudeNum = typeof longitude === 'number' ? longitude : null;
    const sanitizedLocationName = typeof locationName === 'string' ? locationName.slice(0, 100) : null;

    // 緯度経度の範囲チェック
    if (latitudeNum !== null && (latitudeNum < -90 || latitudeNum > 90)) {
      return NextResponse.json(
        { error: '緯度は -90 から 90 の範囲で指定してください' },
        { status: 400 }
      );
    }
    if (longitudeNum !== null && (longitudeNum < -180 || longitudeNum > 180)) {
      return NextResponse.json(
        { error: '経度は -180 から 180 の範囲で指定してください' },
        { status: 400 }
      );
    }

    // 片方だけ指定された場合は無視（両方揃ったときだけ保存）
    const hasBothCoords = latitudeNum !== null && longitudeNum !== null;

    const post = await prisma.post.create({
      data: {
        userId: decoded.userId,
        imageUrl,
        caption,
        tags: tags || '',
        isApproved: false,
        approvalScore: 0,
        visibilityScope: scope as any,
        visibilityDurationMinutes,
        questId: questId || null,
        latitude: hasBothCoords ? latitudeNum : null,
        longitude: hasBothCoords ? longitudeNum : null,
        locationName: hasBothCoords ? sanitizedLocationName : null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    // クエスト進行中として記録（完了済みなら保持、未完は進行中にセット）
    if (questId) {
      const existingProgress = await prisma.userQuestProgress.findUnique({
        where: {
          userId_questId: {
            userId: decoded.userId,
            questId
          }
        }
      });

      if (!existingProgress) {
        await prisma.userQuestProgress.create({
          data: {
            userId: decoded.userId,
            questId,
            completed: false,
            completedAt: null
          }
        });
      } else if (!existingProgress.completed) {
        await prisma.userQuestProgress.update({
          where: {
            userId_questId: {
              userId: decoded.userId,
              questId
            }
          },
          data: {
            completed: false,
            completedAt: null
          }
        });
      }
    }

    // フォロワーに通知を送信（全世界でもフォロワー限定でも）
    const followers = await prisma.follow.findMany({
      where: { followingId: decoded.userId },
      select: { followerId: true }
    });

    for (const follow of followers) {
      await sendNotificationToUser(
        follow.followerId,
        `📸 新しい投稿があります`,
        `投票に参加してあげよう！`,
        `/feed`,
        undefined, // 投稿者を匿名化（誰の投稿かわからないようにする）
        'POST_CREATED'
      );
    }

    return NextResponse.json({
      message: '投稿しました！投票で承認されるまでお待ちください。',
      post: {
        id: post.id,
        isApproved: false
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: '投稿に失敗しました' },
      { status: 500 }
    );
  }
}