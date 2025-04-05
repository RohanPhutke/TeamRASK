// components/Dashboard/EmptyLibraryCard.tsx
const EmptyLibraryCard = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white shadow-md text-center">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-indigo-100 rounded-2xl transform rotate-6"></div>
        <div className="absolute inset-0 bg-purple-100 rounded-2xl transform -rotate-6"></div>
        <div className="absolute inset-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
          <svg
            className="w-10 h-10 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Library Empty</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Upload your first PDF to begin your reading journey
      </p>
      <div className="mt-6 h-1 w-20 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full"></div>
    </div>
  );
};

export default EmptyLibraryCard;
