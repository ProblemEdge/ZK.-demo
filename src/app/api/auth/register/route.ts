import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // バリデーション
    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 409 }
      );
    }

    // パスワードを暗号化
    const passwordHash = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash
      }
    });

    // --- 自動バッジ付与: early-access-badge ---
    try {
      const badge = await prisma.badge.findUnique({ where: { name: 'early-access-badge' } });
      if (badge) {
        const badgeWindowEnd = new Date(badge.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        const cutoff = new Date('2026-02-13T23:59:59Z');

        // 登録日時がバッジ公開から1週間以内、または2026-02-13までに登録された場合に付与
        const registeredAt = user.createdAt;
        if (registeredAt <= badgeWindowEnd || registeredAt <= cutoff) {
          await prisma.userBadge.createMany({
            data: [{ userId: user.id, badgeId: badge.id }],
            skipDuplicates: true
          });
        }
      }
    } catch (err) {
      // バッジ付与失敗は登録自体を失敗にしない（ログのみ）
      console.error('Auto-award badge error:', err);
    }

    return NextResponse.json({
      message: '登録成功',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}