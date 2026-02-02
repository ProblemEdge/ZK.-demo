import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// バッジを削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ badgeId: string }> }
) {
  try {
    const { badgeId } = await context.params;

    // バッジを削除（カスケード削除でUserBadgeも削除される）
    await prisma.badge.delete({
      where: { id: badgeId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting badge:', error);
    return NextResponse.json(
      { error: 'Failed to delete badge' },
      { status: 500 }
    );
  }
}
