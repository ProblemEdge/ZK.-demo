"use client";
import React, { useState } from "react";

type AuthUser = { id?: string | number } | null;

interface MoreButtonProps {
  authorId?: string;
  authUser?: AuthUser;
  onDelete?: () => void;
}

export default function MoreButton({ authorId, authUser, onDelete }: MoreButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!authorId || authUser?.id !== authorId) return null;

  return (
    <div className="absolute right-2 bottom-2">
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
        className="bg-black/40 p-1 rounded-full hover:bg-white/10 transition"
        aria-label="more"
      >
        <img src="/icon/More_horizontal.svg" alt="more" className="w-6 h-6" />
      </button>
      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 bottom-10 bg-[#14161a] border border-white rounded-lg overflow-hidden z-20">
          <button
            onClick={() => { setMenuOpen(false); onDelete && onDelete(); }}
            className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-red-600/20"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
