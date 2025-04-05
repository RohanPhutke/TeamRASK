// components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadingScreen from './UploadingScreen';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { LogOut } from 'lucide-react';
import FloatingDots from './Dashboard/Floatingdots';
import LoadingSpinner from './Dashboard/LoadingSpinner';
import EmptyLibraryCard from './Dashboard/EmptyLibraryCard';
import BookGrid from './Dashboard/BookGrid';
interface BookData {
  id: number;
  title: string;
  fileUrl: string;
  uploadDate: string;
  progress: number;
  collectionName: string;
  lastReadPage?: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Dashboard = () => {
  const [books, setBooks] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { username, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${BACKEND_URL}/books`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);


  const handleContinueReading = (book: BookData) => {
    navigate(`/reader/${book.collectionName}`, {
      state: {
        fileUrl: book.fileUrl,
        collectionName: book.collectionName,
        lastReadPage: book.lastReadPage || 0,
      },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    const username = localStorage.getItem("username");
    if (!username) {
      setUploadError('Username is missing. Please log in again.');
      setIsUploading(false);
      return;
    }
    formData.append('username', username);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BACKEND_URL}/upload/`, formData, {
        headers:
        {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      const { collection_name, file_url } = response.data;
      navigate(`/reader/${collection_name}`, {
        state: {
          fileUrl: file_url,
          lastReadPage: 0,
          collectionName: collection_name,
        },
        replace: true
      });

      setIsUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload the file. Please try again.');
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/assets/backgroundImg.png')",
      }}>
      {/* Subtle animated background elements */}
      <FloatingDots />
      {/* Soft gradient accent in corners */}
      <div className="fixed -left-40 -top-40 w-80 h-80 rounded-full bg-indigo-100/30 blur-3xl opacity-50"></div>
      <div className="fixed -right-40 bottom-0 w-96 h-96 rounded-full bg-purple-100/30 blur-3xl opacity-50"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header with clean white background */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4 bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pb-1">
                Your Digital Library
              </span>
            </h1>
            <p className="mt-2 text-gray-600 font-medium text-lg">
              Welcome back, <span className="font-semibold text-gray-800">{username}</span>!
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Your personalized knowledge hub is ready
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Upload button with clean gradient */}
            <label
              htmlFor="file-upload"
              className="relative inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer font-medium"
            >
              <svg
                className="w-5 h-5 mr-2 -ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload PDF
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-medium flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content area */}
        {isLoading ? (
          <LoadingSpinner />
        ) : books.length === 0 ? (
          <EmptyLibraryCard />
        ) : (
          <BookGrid books={books} handleContinueReading={handleContinueReading} />
        )}
      </div>

      <UploadingScreen
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
      />
    </div>
  );
};

export default Dashboard;

