"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import SimpleTag from "./SimpleTag";
import { VoteOkButton, VoteNgButton } from "./VoteOkNgButton";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import PostStatusTag, { PostStatus } from "./PostStatusTag";
import QuestTag from "./QuestTag";
import VoteStatusLabel, { VoteStatusType } from "./VoteStatusLabel";

interface FeedCardProps {
  imageUrl: string;
  userName: string; // 表示名
  userId: string;   // ユーザー名
  userIconUrl?: string | null; // ユーザーアイコンURL
  postedAt?: string; // 投稿日時（ISO文字列）
  title?: string;   // 投稿タイトル
  tags: string[];
  postStatus?: PostStatus;
  questTag?: string;
  voteStatusType?: VoteStatusType;
  approvedCount?: number;
  rejectedCount?: number;
  isVotingOpen?: boolean;
  isVoting?: boolean;
  voteCount: number;
  likeCount: number;
  hasLiked?: boolean;
  commentCount: number;
  onLike?: () => void;
  onComment?: () => void;
  onVoteOk?: () => void;
  onVoteNg?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

// VoteTimerコンポーネント
const VoteTimer = ({ postedAt }: { postedAt: string }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const postDate = new Date(postedAt);
      const expiryDate = new Date(postDate.getTime() + 5 * 60 * 1000);
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('投票終了');
        return;
      }
      
      const mins = Math.ceil(diff / (1000 * 60));
      setTimeRemaining(`残り ${mins}分`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, [postedAt]);

  return (
    <div className="text-xs text-gray-400 bg-black/60 px-2 py-1 rounded shadow">
      {timeRemaining}
    </div>
  );
};

export default function FeedCard({
  imageUrl,
  userName,
  userId,
  userIconUrl,
  postedAt,
  title,
  tags,
  postStatus,
  questTag,
  voteStatusType,
  approvedCount,
  rejectedCount,
  isVotingOpen,
  isVoting,
  voteCount,
  likeCount,
  hasLiked = false,
  commentCount,
  onLike,
  onComment,
  onVoteOk,
  onVoteNg,
  children,
}: FeedCardProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  return (
    <>
      <div className="bg-black rounded-[16px] border border-white/30 w-[340px] mx-auto overflow-hidden shadow-lg">
        {/* 画像エリア */}
        <div className="relative w-full h-[320px] bg-gray-200 cursor-pointer" onClick={() => setIsImageExpanded(true)}>
          <img
            src={imageUrl}
            alt="投稿画像"
            className="object-cover w-full h-full rounded-tl-[16px] rounded-tr-[16px]"
          />
          {/* 左上: PostStatusTag */}
          {postStatus !== undefined && (
            <div className="absolute left-2 top-2">
              <PostStatusTag status={postStatus} />
            </div>
          )}
          {/* 右上: QuestTag（クエストがある場合のみ表示） */}
            {questTag && (
              <div className="absolute right-2 top-2">
                <QuestTag>{questTag}</QuestTag>
              </div>
            )}
            {/* 右上（削除ボタン） */}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute right-2 top-12 bg-black/60 text-white px-2 py-1 rounded hover:bg-red-600/80 transition"
                aria-label="投稿を削除"
              >
                🗑
              </button>
            )}
          {/* 左下: VoteStatusLabel */}
          {voteStatusType !== undefined && (
            <div className="absolute left-2 bottom-2">
              <VoteStatusLabel type={voteStatusType} approvedCount={approvedCount} rejectedCount={rejectedCount} />
            </div>
          )}
          {/* 右下: 投票ボタン */}
          {isVoting && (
            <div className="absolute right-2 bottom-2 flex gap-2">
              <VoteOkButton onClick={(e) => {
                e.stopPropagation();
                onVoteOk?.();
              }} />
              <VoteNgButton onClick={(e) => {
                e.stopPropagation();
                onVoteNg?.();
              }} />
            </div>
          )}
        </div>
        {/* 本文エリア */}
      <div className="bg-[#222] px-4 pt-3 pb-2 relative">
        {/* 投票数・残り時間 */}
        <div className="absolute right-4 top-3 flex flex-col items-end gap-1 z-10">
          <div className="text-xs text-gray-400 bg-black/60 px-2 py-1 rounded shadow">
            投票数 {voteCount}
          </div>
          {isVotingOpen && postedAt && (
            <VoteTimer postedAt={postedAt} />
          )}
        </div>
        {/* ユーザー情報＋アイコン */}
        <Link href={`/user/${userId}`}>
          <div className="flex items-center gap-3 mb-2 cursor-pointer hover:opacity-75 transition-opacity">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border border-gray-500 flex items-center justify-center">
              {userIconUrl ? (
                <img src={userIconUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xl font-bold">?</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold leading-tight">{userName}</span>
              <span className="text-xs text-gray-400 leading-tight">@{userId}</span>
              {postedAt && (
                <span className="text-xs text-gray-500 leading-tight">{new Date(postedAt).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </Link>
        {/* タイトル（説明欄の上） */}
        {title && (
          <div className="text-lg font-bold text-white mb-1 break-words">{title}</div>
        )}
        {/* 本文 */}
        <div className="text-white text-sm mb-2">
          {children}
        </div>
        {/* タグ: 本文下・Like/コメントの間 */}
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag, i) => (
            <SimpleTag key={i} label={tag} />
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          <LikeButton count={likeCount} initialLiked={hasLiked} onClick={onLike} />
          <CommentButton count={commentCount} onClick={onComment} />
        </div>
      </div>
      </div>

      {/* 画像拡大モーダル */}
      {isImageExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageUrl}
              alt="投稿画像（拡大）"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
