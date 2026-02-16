// Helper function to format Django media URLs securely
export const getMediaUrl = (path) => {
    if (!path) return '';
    // if its already full URL 
    if (path.startsWith('http')) return path;
    // else, prefix it with backend address
    return `http://localhost:8000${path}`;
};