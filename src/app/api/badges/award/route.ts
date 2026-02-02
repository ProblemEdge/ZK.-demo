import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// バッジを付与（管理用）
export async function POST(request: NextRequest) {
  try {
    const { userId, badgeName } = await request.json();

    if (!userId || !badgeName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // バッジが存在するか確認
    const badge = await prisma.badge.findUnique({
      where: { name: badgeName }
    });

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // ユーザーが既にバッジを持っているか確認
    const existingBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: 'User already has this badge' },
        { status: 409 }
      );
    }

    // バッジを付与
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id
      },
      include: {
        badge: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            imageUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      badge: userBadge.badge
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}

// バッジを取り外し（管理用）
export async function DELETE(request: NextRequest) {
  try {
    const { userId, badgeName } = await request.json();

    if (!userId || !badgeName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // バッジが存在するか確認
    const badge = await prisma.badge.findUnique({
      where: { name: badgeName }
    });

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // バッジを削除
    await prisma.userBadge.delete({
      where: { userId_badgeId: { userId, badgeId: badge.id } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing badge:', error);
    return NextResponse.json(
      { error: 'Failed to remove badge' },
      { status: 500 }
    );
  }
}
