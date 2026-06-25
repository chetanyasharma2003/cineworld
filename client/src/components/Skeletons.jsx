// ─── Reusable skeleton shapes ──────────────────────────────
// All skeleton blocks use the `.skeleton` shimmer class from index.css

// Single movie poster card — matches Row.jsx MovieCard dimensions
export function SkeletonCard({ large = false }) {
  const width = large ? "min-w-[280px] md:min-w-[320px]" : "min-w-[130px] md:min-w-[155px]";
  const height = large ? "h-[160px] md:h-[185px]" : "h-[195px] md:h-[235px]";
  return <div className={`skeleton rounded-lg shrink-0 ${width} ${height}`} />;
}

// Full row — title bar + scrollable strip of skeleton cards
export function SkeletonRow({ large = false, count = 8 }) {
  return (
    <div className="my-2 px-4 md:px-8">
      <div className="skeleton h-5 w-48 rounded mb-3" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} large={large} />
        ))}
      </div>
    </div>
  );
}

// Full-height hero banner skeleton
export function SkeletonBanner() {
  return (
    <div className="relative w-full h-screen bg-[#060c18] overflow-hidden">
      <div className="skeleton absolute inset-0" />
      {/* Gradient overlays to match real banner */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center px-8 md:px-16 pt-16">
        <div className="flex flex-col gap-4 max-w-xl w-full">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-14 md:h-20 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="flex gap-3 mt-2">
            <div className="skeleton h-12 w-28 rounded-lg" />
            <div className="skeleton h-12 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid of poster cards (MyList, Watchlist)
export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="skeleton w-full aspect-[2/3] rounded-xl" />
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// MovieDetail hero + tabs skeleton
export function SkeletonMovieDetail() {
  return (
    <div className="bg-[#0f0f0f] min-h-screen">
      {/* Hero backdrop */}
      <div className="relative h-[70vh]">
        <div className="skeleton absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
        <div className="absolute bottom-10 left-6 md:left-12 flex flex-col gap-3 max-w-xl">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-10 md:h-14 w-80 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded" />
          <div className="flex gap-3 mt-1">
            <div className="skeleton h-10 w-36 rounded-xl" />
            <div className="skeleton h-10 w-28 rounded-xl" />
            <div className="skeleton h-10 w-28 rounded-xl" />
            <div className="skeleton h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="px-6 md:px-12 py-6">
        {/* Tab strip */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
          {[80, 60, 60, 80, 72].map((w, i) => (
            <div key={i} className={`skeleton h-9 rounded-t-lg`} style={{ width: w }} />
          ))}
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-4">
            <div className="skeleton w-[200px] aspect-[2/3] rounded-2xl mx-auto lg:mx-0" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="flex gap-2 flex-wrap mt-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="skeleton h-8 w-20 rounded-full" />
              ))}
            </div>
            {/* Cast strip */}
            <div className="skeleton h-5 w-24 rounded mt-4" />
            <div className="flex gap-3">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="skeleton w-16 h-16 rounded-full" />
                  <div className="skeleton h-3 w-14 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Actor detail page skeleton
export function SkeletonActorDetail() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-24 px-6 md:px-12 pb-16">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="skeleton w-48 h-64 rounded-2xl shrink-0 mx-auto md:mx-0" />
        <div className="flex flex-col gap-3 flex-1 pt-2">
          <div className="skeleton h-8 w-56 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
      </div>
      <div className="skeleton h-5 w-32 rounded mb-3" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// TV Shows page skeleton (banner + rows)
export function SkeletonTVShows() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <SkeletonBanner />
      <div className="relative z-10 -mt-16 space-y-6 pb-16">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

// TV Detail page skeleton
export function SkeletonTVDetail() {
  return (
    <div className="bg-[#0f0f0f] min-h-screen">
      <div className="relative h-[70vh]">
        <div className="skeleton absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
        <div className="absolute bottom-10 left-6 md:left-12 flex flex-col gap-3 max-w-xl">
          <div className="skeleton h-10 md:h-14 w-80 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded" />
          <div className="flex gap-3 mt-1">
            <div className="skeleton h-10 w-32 rounded-xl" />
            <div className="skeleton h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="px-6 md:px-12 py-8 flex flex-col gap-4">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="flex gap-2 flex-wrap mt-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-7 w-20 rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
