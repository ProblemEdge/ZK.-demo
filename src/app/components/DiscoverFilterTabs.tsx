'use client';

interface DiscoverFilterTabsProps {
  activeFilter: 'discover' | 'friend' | 'pending' | 'request';
  onFilterChange: (filter: 'discover' | 'friend' | 'pending' | 'request') => void;
}

export default function DiscoverFilterTabs({
  activeFilter,
  onFilterChange
}: DiscoverFilterTabsProps) {
  const tabs = [
    { id: 'discover', label: '発見', icon: '/icon/Search.svg' },
    { id: 'friend', label: '友達', icon: '/icon/Users.svg' },
    { id: 'pending', label: '申請中', icon: '/icon/Smile.svg' },
    { id: 'request', label: 'リクエスト', icon: '/icon/Shopping bag.svg' }
  ];

  return (
    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id as 'discover' | 'friend' | 'pending' | 'request')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeFilter === tab.id
              ? 'bg-[#14161a] border border-white text-white'
              : 'bg-[#475467] text-white hover:bg-[#556578]'
          }`}
        >
          <img src={tab.icon} alt={tab.label} className="w-5 h-5 rounded-full object-cover" />
          <span className="text-sm">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
