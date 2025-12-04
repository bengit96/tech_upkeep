export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="animate-pulse space-y-8">
          {/* Title skeleton */}
          <div className="h-12 bg-gray-800 rounded w-3/4"></div>
          <div className="h-6 bg-gray-800 rounded w-1/2"></div>

          {/* Post skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="h-8 bg-gray-800 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
