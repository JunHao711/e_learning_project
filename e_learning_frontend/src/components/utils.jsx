// Helper function to format Django media URLs securely
export const getMediaUrl = (path) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

    if (!path) return '';
    // if its already full URL 
    if (path.startsWith('http')) return path;
    // else, prefix it with backend address
    return `${BASE_URL}${path}`;
};