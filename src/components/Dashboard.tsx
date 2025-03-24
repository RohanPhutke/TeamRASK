import React, { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Interface for book data
interface BookData {
  id: number;
  title: string;
  fileName: string;
  uploadDate: string;
  progress: number;
  collectionName: string;
}

const Dashboard = () => {
  const [books, setBooks] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse query params for direct file opening
    const params = new URLSearchParams(location.search);
    const fileId = params.get('file');
    
    if (fileId) {
      // Find the book with the matching ID and navigate to its reader
      const bookToOpen = dummyBooks.find(book => book.id === parseInt(fileId));
      if (bookToOpen) {
        navigate(`/reader/${bookToOpen.collectionName}`);
      }
    }
    
    // In a real app, fetch books from API
    fetchBooks();
  }, [location, navigate]);

  const fetchBooks = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('http://127.0.0.1:8000/books/');
      // setBooks(response.data);
      
      // For now, use dummy data
      setBooks(dummyBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dummy data for previously uploaded books
  const dummyBooks: BookData[] = [
    { id: 1, title: 'Introduction to React', fileName: 'intro-react.pdf', uploadDate: '2025-03-15', progress: 75, collectionName: 'intro-react' },
    { id: 2, title: 'JavaScript Design Patterns', fileName: 'js-patterns.pdf', uploadDate: '2025-03-10', progress: 30, collectionName: 'js-patterns' },
    { id: 3, title: 'TypeScript Handbook', fileName: 'typescript-handbook.pdf', uploadDate: '2025-03-05', progress: 100, collectionName: 'typescript-handbook' },
    { id: 4, title: 'CSS Grid & Flexbox', fileName: 'css-layout.pdf', uploadDate: '2025-02-28', progress: 45, collectionName: 'css-layout' },
    { id: 5, title: 'React Hooks In Depth', fileName: 'react-hooks.pdf', uploadDate: '2025-02-20', progress: 60, collectionName: 'react-hooks' },
  ];

  const handleContinueReading = (collectionName: string) => {
    navigate(`/reader/${collectionName}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Your Reading Dashboard</h1>
          <input
            type="file"
            id="file-upload"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              // Handle file upload logic here
              console.log("File selected:", e.target.files?.[0]);
              // In a real app, you would handle the upload and then redirect
            }}
          />
          <label 
            htmlFor="file-upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer font-medium"
          >
            Upload New PDF
          </label>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading your books...</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Books</h2>
              <p className="text-gray-500">Continue reading where you left off</p>
            </div>

            {books.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">You haven't uploaded any books yet.</p>
                <label 
                  htmlFor="file-upload"
                  className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer font-medium"
                >
                  Upload Your First Book
                </label>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {books.map(book => (
                  <div key={book.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <Book size={24} className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-800">{book.title}</h3>
                          <p className="text-sm text-gray-500">{book.fileName}</p>
                          <p className="text-xs text-gray-400 mt-1">Uploaded on {new Date(book.uploadDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleContinueReading(book.collectionName)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Continue Reading
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 font-medium">Progress</span>
                        <span className="text-sm text-gray-600 font-medium">{book.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${book.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;