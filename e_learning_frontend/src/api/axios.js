import axios from "axios";

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocal 
    ? 'http://localhost:8000/api/' 
    : `http://${window.location.hostname}:8000/api/`;

const api = axios.create({
    baseURL: API_BASE_URL, // my django backend endpoint
    timeout: 10000,
    headers: {
        'Content-Type':'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest.url.includes('token/')) 
        {        
            localStorage.clear();
            window.location.href = '/login?error=session_expired';
        }
        return Promise.reject(error)
    }
)

export default api;