import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

function promptConfirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('注意: これから「全アカウント関連データ」を削除します。バッジ定義（Badge モデル）は残ります。');
  const ans = await promptConfirm('実行してよいですか？ (yes/no): ');
  if (ans !== 'yes') {
    console.log('中止しました。');
    await prisma.$disconnect();
    process.exit(0);
  }

  try {
    console.log('投票データを削除中...');
    const votes = await prisma.vote.deleteMany({});
    console.log(`${votes.count} 件の vote を削除しました`);

    console.log('いいねデータを削除中...');
    const likes = await prisma.like.deleteMany({});
    console.log(`${likes.count} 件の like を削除しました`);

    console.log('コメントデータを削除中...');
    const comments = await prisma.comment.deleteMany({});
    console.log(`${comments.count} 件の comment を削除しました`);

    console.log('報告データを削除中...');
    const reports = await prisma.report.deleteMany({});
    console.log(`${reports.count} 件の report を削除しました`);

    console.log('通知データを削除中...');
    const notifications = await prisma.notification.deleteMany({});
    console.log(`${notifications.count} 件の notification を削除しました`);

    console.log('フレンドリクエストを削除中...');
    const friendReqs = await prisma.friendRequest.deleteMany({});
    console.log(`${friendReqs.count} 件の friendRequest を削除しました`);

    console.log('フレンド関係を削除中...');
    const friends = await prisma.friend.deleteMany({});
    console.log(`${friends.count} 件の friend を削除しました`);

    console.log('PushSubscription を削除中...');
    const pushes = await prisma.pushSubscription.deleteMany({});
    console.log(`${pushes.count} 件の pushSubscription を削除しました`);

    console.log('ユーザークエスト進行を削除中...');
    const progresses = await prisma.userQuestProgress.deleteMany({});
    console.log(`${progresses.count} 件の userQuestProgress を削除しました`);

    console.log('ユーザーバッジ（UserBadge）を削除中...（Badge 定義は残ります）');
    const userBadges = await prisma.userBadge.deleteMany({});
    console.log(`${userBadges.count} 件の userBadge を削除しました`);

    console.log('投稿に紐づく残りデータを削除（念のため）...');
    // posts の子テーブルは上で大半を削除しているが念のため
    await prisma.vote.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});

    console.log('投稿 (Post) を削除中...');
    const posts = await prisma.post.deleteMany({});
    console.log(`${posts.count} 件の post を削除しました`);

    console.log('最後にユーザーアカウントを削除中...');
    const users = await prisma.user.deleteMany({});
    console.log(`${users.count} 件の user を削除しました`);

    console.log('完了しました。Badge テーブルは保持されています。必要ならファイルアップロード（public/uploads）等のクリーンアップも行ってください。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
