import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// クエストのテンプレート
const QUEST_TEMPLATES = [
  { title: '松本城と写真を撮る', description: '松本城が写っている写真を投稿しよう' },
  { title: '松本の食事', description: '松本の美味しい食べ物の写真を投稿しよう' },
  { title: 'おすすめの松本の場所', description: 'あなたのお気に入りの松本の場所を紹介しよう' },
  { title: '松本の自然', description: '松本の美しい自然の写真を撮ろう' },
  { title: '松本の伝統文化', description: '松本の伝統や文化に触れる写真を撮ろう' },
  { title: '松本の街並み', description: '松本らしい街並みの写真を投稿しよう' },
  { title: '松本の季節', description: '今の季節の松本を切り取ろう' },
  { title: '松本の隠れた名所', description: 'あまり知られていない松本の魅力を発見しよう' },
  { title: '松本の人々', description: '松本で出会った人や風景を撮ろう' },
  { title: '松本の夜景', description: '夜の松本の美しさを撮影しよう' }
];

// 今日の0時を取得（日本時刻）
function getTodayMidnight(): Date {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const todayJst = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
  return new Date(todayJst.getTime() - (9 * 60 * 60 * 1000));
}

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

    jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const today = getTodayMidnight();

    // 今日のクエストをすべて削除
    await prisma.dailyQuest.deleteMany({
      where: { date: today }
    });

    // 新しいクエストを生成
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    const quests = await Promise.all(
      selected.map((template, index) =>
        prisma.dailyQuest.create({
          data: {
            title: template.title,
            description: template.description,
            date: today,
            order: index
          }
        })
      )
    );

    return NextResponse.json({
      message: 'クエストをリセットしました',
      quests
    });

  } catch (error) {
    console.error('Reset quests error:', error);
    return NextResponse.json(
      { error: 'クエストのリセットに失敗しました' },
      { status: 500 }
    );
  }
}
