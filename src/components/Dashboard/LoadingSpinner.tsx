// components/Dashboard/LoadingSpinner.tsx
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white shadow-md">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-gray-700 font-medium">Loading your collection...</p>
    </div>
  );
};

export default LoadingSpinner;
