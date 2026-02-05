#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs(argv) {
  const out = {};
  argv.slice(2).forEach((arg) => {
    if (arg === '--use-badge-window') out.useBadgeWindow = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--badge-name=')) out.badgeName = arg.split('=')[1];
    else if (arg.startsWith('--cutoff-date=')) out.cutoffDate = arg.split('=')[1];
  });
  return out;
}

function parseDateEndOfDay(dateStr) {
  // Accept YYYY-MM-DD and ISO; if plain date, treat as end of day UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T23:59:59Z');
  }
  return new Date(dateStr);
}

async function main() {
  const args = parseArgs(process.argv);
  const badgeName = args.badgeName || 'early-access-badge';
  const useBadgeWindow = !!args.useBadgeWindow;
  const dryRun = !!args.dryRun;

  console.log('Badge:', badgeName, 'useBadgeWindow:', useBadgeWindow, 'dryRun:', dryRun);

  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) {
    console.error('Badge not found:', badgeName);
    process.exit(1);
  }

  const start = badge.createdAt;
  let end = null;

  if (useBadgeWindow) {
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    console.log('Using badge-created window:', start.toISOString(), '->', end.toISOString());
  } else if (args.cutoffDate) {
    end = parseDateEndOfDay(args.cutoffDate);
    console.log('Using cutoff date:', end.toISOString());
  } else {
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    console.log('Default: using badge-created + 7 days window:', start.toISOString(), '->', end.toISOString());
  }

  // Find users registered between badge.createdAt (inclusive) and end (inclusive)
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true, username: true, createdAt: true },
  });

  console.log('Matched users:', users.length);
  if (users.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (dryRun) {
    console.log('Dry run — would award badge to these users (sample 20):');
    console.table(users.slice(0, 20).map(u => ({ id: u.id, username: u.username, createdAt: u.createdAt.toISOString() })));
    await prisma.$disconnect();
    return;
  }

  const data = users.map((u) => ({ userId: u.id, badgeId: badge.id }));

  // Use createMany with skipDuplicates to avoid unique constraint errors
  const result = await prisma.userBadge.createMany({ data, skipDuplicates: true });

  console.log('createMany result:', result);
  console.log('Awarded badge to', users.length, 'users (duplicates were skipped).');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect().finally(() => process.exit(1));
});

# Usage examples:
# node scripts/award-early-access.mjs --badge-name=early-access-badge --use-badge-window
# node scripts/award-early-access.mjs --badge-name=early-access-badge --cutoff-date=2026-02-13 --dry-run
