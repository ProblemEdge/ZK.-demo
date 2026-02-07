import ProfileHeader from '../../components/ProfileHeader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0c0f] pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="sticky top-0 z-40 bg-[#0b0c0f]">
        <ProfileHeader />
      </div>

      {/* Profile skeleton */}
      <div className="mx-3 mt-4 bg-[#14161a] border border-white rounded-2xl p-4">
        <div className="flex items-start gap-3">
          {/* Avatar skeleton */}
          <div className="w-[64px] h-[64px] bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>

          {/* User info skeleton */}
          <div className="flex-1 min-w-0">
            <div className="h-7 w-32 bg-gray-700 animate-pulse rounded mb-2"></div>
            <div className="h-5 w-24 bg-gray-700 animate-pulse rounded mb-3"></div>
            <div className="h-9 w-32 bg-gray-700 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mt-4 flex items-center gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-700 animate-pulse rounded"></div>
              <div>
                <div className="h-6 w-12 bg-gray-700 animate-pulse rounded mb-1"></div>
                <div className="h-3 w-8 bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BottomNav moved to RootLayout */}
    </div>
  );
}
