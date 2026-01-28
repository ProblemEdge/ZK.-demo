import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { REWARD_CONFIG, getExpForLevel } from '../../utils/rewards';

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

    // 未読の承認通知を取得
    const approvalNotifications = await prisma.notification.findMany({
      where: {
        userId: decoded.userId,
        type: 'POST_APPROVED',
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 10000) // 最近10秒以内の通知のみ
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (approvalNotifications.length === 0) {
      return NextResponse.json({ hasReward: false });
    }

    // 報酬情報を計算
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        level: true,
        experience: true,
        gems: true
      }
    });

    if (!user) {
      return NextResponse.json({ hasReward: false });
    }

    // 通知を既読にする
    await prisma.notification.update({
      where: { id: approvalNotifications[0].id },
      data: { isRead: true }
    });

    const expToNextLevel = getExpForLevel(user.level);

    // 承認報酬とクエストボーナスの合計を返す
    // (通知のタイプで判断するのではなく、固定で承認報酬を返す)
    return NextResponse.json({
      hasReward: true,
      reward: {
        gems: REWARD_CONFIG.postApproved.gems,
        exp: REWARD_CONFIG.postApproved.exp,
        currentExp: user.experience,
        expToNextLevel,
        level: user.level,
        message: '投稿が承認されました！'
      }
    });

  } catch (error) {
    console.error('Check rewards error:', error);
    return NextResponse.json(
      { error: '報酬チェックに失敗しました' },
      { status: 500 }
    );
  }
}
