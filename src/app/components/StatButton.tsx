import Image from 'next/image';

interface StatButtonProps {
  type: 'level' | 'gem' | 'votes' | 'likes';
  label: string;
  onClick?: () => void;
  active?: boolean;
}

const STAT_CONFIG = {
  level: {
    icon: '/icon/level_icon.svg',
    bgColor: 'bg-[#14161a]',
    iconSize: { width: 16, height: 16 }
  },
  gem: {
    icon: '/icon/Gem_Icon.png',
    bgColor: 'bg-[#14161a]',
    iconSize: { width: 16, height: 16 }
  },
  votes: {
    icon: '/icon/Check_square.svg',
    bgColor: 'bg-[#14161a]',
    iconSize: { width: 16, height: 16 }
  },
  likes: {
    icon: '/icon/Heart_icon.svg',
    bgColor: 'bg-[#14161a]',
    iconSize: { width: 16, height: 16 }
  }
} as const;

export default function StatButton({ type, label, onClick, active = false }: StatButtonProps) {
  const config = STAT_CONFIG[type];
  const bgColor = active ? 'bg-[#00e676]' : config.bgColor;
  
  return (
    <button
      onClick={onClick}
      className={`
        ${bgColor}
        border border-solid border-white
        h-[24px]
        rounded-[32px]
        flex items-center justify-center gap-1
        px-2
        text-white text-[15px] font-bold
        whitespace-nowrap
        leading-none
        hover:opacity-80
        transition-opacity
        mx-[2px]
      `}
    >
      <Image
        src={config.icon}
        alt={type}
        width={config.iconSize.width}
        height={config.iconSize.height}
        className="shrink-0"
      />
      <span>{label}</span>
    </button>
  );
}
