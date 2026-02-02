import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// ユーザーのバッジを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    console.log('Fetching badges for userId:', userId);

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
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
      },
      orderBy: { awardedAt: 'desc' }
    });

    console.log('Found badges:', userBadges.length);

    const badges = userBadges.map(ub => ({
      id: ub.badge.id,
      name: ub.badge.name,
      displayName: ub.badge.displayName,
      description: ub.badge.description,
      imageUrl: ub.badge.imageUrl,
      awardedAt: ub.awardedAt
    }));

    return NextResponse.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
