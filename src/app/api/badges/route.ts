import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// バッジ一覧を取得
export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

// バッジを作成
export async function POST(request: NextRequest) {
  try {
    const { name, displayName, description, imageUrl } = await request.json();

    if (!name || !displayName || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 同じ名前のバッジが既に存在するか確認
    const existingBadge = await prisma.badge.findUnique({
      where: { name }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: 'Badge with this name already exists' },
        { status: 409 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        displayName,
        description: description || null,
        imageUrl
      }
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    );
  }
}
