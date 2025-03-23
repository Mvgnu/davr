import axios from 'axios';
import { getSession } from 'next-auth/react';

// Create a custom axios instance
const axiosInstance = axios.create({
  // Use absolute URL instead of relative paths to avoid 'Invalid URL' errors
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Ensure baseURL is set for server-side rendering
    if (!config.baseURL || config.baseURL === '') {
      config.baseURL = 'http://localhost:3000';
    }
    
    const session = await getSession();
    
    if (session?.user) {
      // Add authorization header if user is logged in
      config.headers = config.headers || {};
      
      // NextAuth doesn't include accessToken by default in the Session type
      // So we either need to extend the Session type or access it this way
      const token = (session as any).accessToken || '';
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Refresh token logic would go here if implemented
        // For now, we'll just redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default axiosInstance; 