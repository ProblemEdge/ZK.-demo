import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { QUEST_POOL } from '@/lib/questTemplates';

// 今日の0時を取得（日本時刻）
function getTodayMidnight(): Date {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayJst = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
  return new Date(todayJst.getTime() - 9 * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find((row) => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const today = getTodayMidnight();

    // 今日のクエストをすべて削除
    await prisma.dailyQuest.deleteMany({
      where: { date: today },
    });

    // 新しいクエストを生成
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    const quests = await Promise.all(
      selected.map((template, index) =>
        prisma.dailyQuest.create({
          data: {
            title: template.title,
            description: template.description,
            date: today,
            order: index,
          },
        }),
      ),
    );

    return NextResponse.json({
      message: 'クエストをリセットしました',
      quests,
    });
  } catch (error) {
    console.error('Reset quests error:', error);
    return NextResponse.json({ error: 'クエストのリセットに失敗しました' }, { status: 500 });
  }
}
