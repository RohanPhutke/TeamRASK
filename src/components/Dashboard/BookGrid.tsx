import React from "react";

interface Book {
    id: number;
    title: string;
    fileUrl: string;
    uploadDate: string;
    progress: number;
    collectionName: string;
    lastReadPage?: number;
}

interface BookGridProps {
    books: Book[];
    handleContinueReading: (book: Book) => void;
}

const BookGrid: React.FC<BookGridProps> = ({ books, handleContinueReading }) => {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
                <div
                    key={book.id}
                    className="group relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 hover:border-indigo-200"
                >
                    {/* Book progress indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500 ease-out"
                            style={{ width: `${book.progress}%` }}
                        ></div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-lg shadow-inner">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
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
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                    {book.title}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-gray-500">
                                    Added {new Date(book.uploadDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            {book.progress > 0 ? (
                                <div className="flex items-center">
                                    <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-3">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500 ease-out"
                                            style={{ width: `${book.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                        {Math.round(book.progress)}%
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs font-medium text-gray-400">
                                    Not started
                                </span>
                            )}

                            <button
                                onClick={() => handleContinueReading(book)}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300"
                            >
                                {book.progress > 0 ? "Continue" : "Start"}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BookGrid;
