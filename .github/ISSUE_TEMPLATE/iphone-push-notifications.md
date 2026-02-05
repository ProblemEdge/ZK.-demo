---
name: iPhone でプッシュ通知が届かない
about: PWA / iOS 向けのプッシュ通知が端末に届かない問題の調査・対応用
title: '[Bug] iPhone にプッシュ通知が届かない'
labels: bug, notifications, pwa
---

## 概要
PWA（iOS）でアプリ内には通知が溜まっているが、iPhone の通知センターやロック画面にプッシュ通知が届かない。

## 再現手順
1. iPhone の Safari でサイトにアクセス（HTTPS 環境）
2. 通知を許可し、ホーム画面に追加（PWA としてインストール）
3. サーバー側で `sendNotificationToUser()` を実行
4. アプリ内には通知が保存されるが、iPhone へプッシュ通知が届かない

## 確認・所見（実施済み）
- `public/sw.js` に `push` イベントと `notificationclick` が実装されている。
- クライアントで `navigator.serviceWorker.register('/sw.js')` と `pushManager.subscribe()` を実行して購読を作成している。
- サーバー側で `web-push` を使いプッシュ送信している（`src/app/api/utils/notifications.ts`）。

問題の原因候補と対応:

1. サーバーで使う VAPID 公開鍵が未設定または誤った環境変数を参照している。
   - 修正: サーバー側では `VAPID_PUBLIC_KEY` を優先的に使用し、なければ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` をフォールバックするようにした。

2. クライアントが既存の購読を再利用せず、重複/不整合を起こしている可能性。
   - 修正: クライアントで `registration.pushManager.getSubscription()` をチェックし、既存購読があればそれをサーバーに再送するようにした。

3. iOS の仕様：Safari / iOS のバージョン依存や PWA インストール状態による制限
   - 対処: ユーザーに iOS 16.4 以上であること、サイトが HTTPS、PWA をホーム画面に追加済みであることを確認してもらう。

## 次の手順
1. デプロイして環境変数 `VAPID_PUBLIC_KEY` と `VAPID_PRIVATE_KEY` を設定する。
2. iPhone で PWA をホーム画面に追加して再検証。
3. サーバー側の送信ログ（`web-push` の例外やステータス）を確認する。

## 参考
- iOS の Web Push サポート状況（Safari / iOS バージョン）
