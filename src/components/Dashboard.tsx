// import React, { useState, useEffect } from 'react';
// import { Book } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import UploadingScreen from './UploadingScreen';
// import axios from 'axios';

// interface BookData {
//   id: number;
//   title: string;
//   fileUrl: string;
//   uploadDate: string;
//   progress: number;
//   collectionName: string;
//   lastReadPage?: number;
// }

// const Dashboard = () => {
//   const [books, setBooks] = useState<BookData[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploadError, setUploadError] = useState<string | null>(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchBooks = async () => {
//       try {
//         const response = await axios.get('http://127.0.0.1:8000/api/books');
//         setBooks(response.data);
//       } catch (error) {
//         console.error('Error fetching books:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchBooks();
//   }, []);

//   const handleContinueReading = (book: BookData) => {
//     navigate(`/reader/${book.collectionName}`, {
//       state: {
//         fileUrl: book.fileUrl,
//         collectionName: book.collectionName,
//         lastReadPage: book.lastReadPage || 0,
//       },
//     });
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (file.type !== 'application/pdf') {
//       setUploadError('Please select a PDF file');
//       return;
//     }

//     setUploadError(null);
//     setIsUploading(true);
//     setUploadProgress(0);

//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round(
//             (progressEvent.loaded * 100) / (progressEvent.total || 1)
//           );
//           setUploadProgress(percentCompleted);
//         },
//       });
      
//       const { collection_name, file_url } = response.data;
//       navigate(`/reader/${collection_name}`, {
//         state: {
//           fileUrl: file_url,
//           lastReadPage: 0,
//           collectionName: collection_name,
//         },
//       });

//       setIsUploading(false);
//     } catch (error) {
//       console.error('Upload error:', error);
//       setUploadError('Failed to upload the file. Please try again.');
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//     <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       {/* Header with glassmorphism effect */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4 backdrop-blur-sm">
//         <div>
//         <h1 className="text-4xl font-extrabold tracking-tight">
//           <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pb-1">
//             Your Digital Library
//           </span>
//         </h1>
//           <p className="mt-2 text-gray-600/90 font-light">Curated knowledge at your fingertips</p>
//         </div>
        
//         {/* Upload button with micro-interactions */}
//         <label
//           htmlFor="file-upload"
//           className="relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer font-medium group overflow-hidden"
//         >
//           <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//           <span className="relative z-10 flex items-center">
//             <svg className="w-5 h-5 mr-3 -ml-1 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//             </svg>
//             Upload PDF
//           </span>
//           <input
//             type="file"
//             id="file-upload"
//             accept=".pdf"
//             className="hidden"
//             onChange={handleFileUpload}
//           />
//         </label>
//       </div>
  
//       {/* Content area */}
//       {isLoading ? (
//         <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
//           <div className="relative">
//             <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
//             <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
//           </div>
//           <p className="mt-6 text-gray-700 font-medium animate-pulse">Loading your collection...</p>
//         </div>
//       ) : books.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 text-center">
//           <div className="relative w-24 h-24 mb-6">
//             <div className="absolute inset-0 bg-indigo-100 rounded-2xl transform rotate-6"></div>
//             <div className="absolute inset-0 bg-indigo-200 rounded-2xl transform -rotate-6"></div>
//             <div className="absolute inset-2 bg-white rounded-xl shadow-inner flex items-center justify-center transform rotate-3">
//               <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//               </svg>
//             </div>
//           </div>
//           <h3 className="text-2xl font-bold text-gray-900 mb-2">Library Empty</h3>
//           <p className="text-gray-600 max-w-md mx-auto">Upload your first PDF to begin your reading journey</p>
//           <div className="mt-6 h-1 w-20 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full"></div>
//         </div>
//       ) : (
//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {books.map((book) => (
//             <div 
//               key={book.id} 
//               className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200/50 hover:border-indigo-200/80"
//             >
//               {/* Book progress indicator */}
//               <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden">
//                 <div 
//                   className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500 ease-out" 
//                   style={{ width: `${book.progress}%` }}
//                 ></div>
//               </div>
              
//               <div className="p-6">
//                 <div className="flex items-start gap-4">
//                   <div className="flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-lg shadow-inner">
//                     <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                     </svg>
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
//                     <p className="mt-1 text-xs font-medium text-gray-500/90">Added {new Date(book.uploadDate).toLocaleDateString()}</p>
//                   </div>
//                 </div>
                
//                 <div className="mt-6 flex items-center justify-between">
//                   {book.progress > 0 ? (
//                     <div className="flex items-center">
//                       <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-3">
//                         <div 
//                           className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500 ease-out" 
//                           style={{ width: `${book.progress}%` }}
//                         ></div>
//                       </div>
//                       <span className="text-xs font-medium text-gray-600">{Math.round(book.progress)}%</span>
//                     </div>
//                   ) : (
//                     <span className="text-xs font-medium text-gray-400">Not started</span>
//                   )}
                  
//                   <button
//                     onClick={() => handleContinueReading(book)}
//                     className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300 transform group-hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
//                   >
//                     {book.progress > 0 ? 'Continue' : 'Start'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
  
//     <UploadingScreen
//       isUploading={isUploading}
//       uploadProgress={uploadProgress}
//       uploadError={uploadError}
//     />
//   </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadingScreen from './UploadingScreen';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface BookData {
  id: number;
  title: string;
  fileUrl: string;
  uploadDate: string;
  progress: number;
  collectionName: string;
  lastReadPage?: number;
}

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
        const response = await axios.get('http://127.0.0.1:8000/api/books');
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

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with glassmorphism effect */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4 backdrop-blur-sm">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pb-1">
                Your Digital Library
              </span>
            </h1>
            <p className="mt-2 text-gray-600/90 font-light">
              Welcome, {username}! Curated knowledge at your fingertips
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Upload button with micro-interactions (smaller padding) */}
            <label
              htmlFor="file-upload"
              className="relative inline-flex items-center px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer font-medium group overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2 -ml-1 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload PDF
              </span>
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Logout button (smaller padding) */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
  
        {/* Content area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-700 font-medium animate-pulse">Loading your collection...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-indigo-100 rounded-2xl transform rotate-6"></div>
              <div className="absolute inset-0 bg-indigo-200 rounded-2xl transform -rotate-6"></div>
              <div className="absolute inset-2 bg-white rounded-xl shadow-inner flex items-center justify-center transform rotate-3">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Library Empty</h3>
            <p className="text-gray-600 max-w-md mx-auto">Upload your first PDF to begin your reading journey</p>
            <div className="mt-6 h-1 w-20 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full"></div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <div 
                key={book.id} 
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200/50 hover:border-indigo-200/80"
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
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                      <p className="mt-1 text-xs font-medium text-gray-500/90">Added {new Date(book.uploadDate).toLocaleDateString()}</p>
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
                        <span className="text-xs font-medium text-gray-600">{Math.round(book.progress)}%</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">Not started</span>
                    )}
                    
                    <button
                      onClick={() => handleContinueReading(book)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300 transform group-hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                    >
                      {book.progress > 0 ? 'Continue' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

