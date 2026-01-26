'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/feed', label: 'フィード', icon: '📱' },
    { href: '/vote', label: '投票', icon: '✅' },
    { href: '/discover', label: 'ユーザー', icon: '🔍' },
    { href: '/post', label: '投稿', icon: '📸' },
    { href: '/profile', label: 'プロフィール', icon: '👤' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition ${ 
              pathname === item.href ? 'text-green-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}