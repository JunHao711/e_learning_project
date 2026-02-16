// src/pages/UserSearch.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

export default function UserSearch() {
  // user input for search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Debounced Search Effect
  useEffect(() => {
    // If the search query is empty, clear results
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    // Setup a timer to delay the API call
    // wait for 500ms after the users stop typing before request
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`users/search/?q=${encodeURIComponent(searchQuery)}`);
        const data = response.data.results ? response.data.results : response.data;
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search error:", err);
        setError('Failed to fetch search results.');
      } finally {
        setIsSearching(false);
      }
    }, 500); // Wait 500ms after the user stops typing

    // clears the timer if the user types again within 500ms
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); // runs every time searchQuery changes 

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Find People</h1>
          <p className="text-slate-500">Search for students, teachers, and peers in the community.</p>
        </div>

        {/* Search Input Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-4 border border-slate-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-shadow bg-white"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="animate-pulse text-indigo-500 text-sm font-semibold">Searching...</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && <div className="text-center text-red-500 font-medium">{error}</div>}

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {!isSearching && searchQuery && results.length === 0 && !error && (
            <div className="col-span-full text-center text-slate-500 py-10">
              No users found matching "{searchQuery}".
            </div>
          )}

          {results.map((user) => (
            <Link 
              to={`/profile/${user.username}`} 
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              {/* User Avatar */}
              <div className="w-20 h-20 rounded-full mb-4 border-2 border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                {user.photo ? (
                  <img src={getMediaUrl(user.photo)} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {user.username}
              </h3>
              <span className="px-2.5 py-0.5 mt-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-full tracking-widest">
                {user.role}
              </span>
              <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                {user.bio || "No bio available."}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}