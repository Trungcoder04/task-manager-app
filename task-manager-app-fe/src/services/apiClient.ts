import axios, { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://task-manager-app-c46e.onrender.com/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000, // 20 giây timeout – ngăn Render spin-down im lặng
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm token nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Trả về response.data và bóc tách error message từ BE
apiClient.interceptors.response.use(
  (response) => {
    // Nếu backend trả về HTTP 200 nhưng code khác 1000 (code lỗi nghiệp vụ)
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      const data = response.data as { code?: number; message?: string };
      if (data.code !== undefined && data.code !== 1000) {
        return Promise.reject(new Error(data.message || 'Thao tác không thành công'));
      }
    }
    return response.data;
  },
  (error) => {
    let message: string;
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Không thể kết nối máy chủ. Máy chủ có thể đang khởi động lại (30s), vui lòng thử lại!';
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'Đã có lỗi xảy ra khi kết nối máy chủ';
    }
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
