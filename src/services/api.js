import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // If frontend is running locally, use the active local backend server on port 5000
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000';
  }
  return '/api';
};

const API_BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  if (API_BASE_URL === '/api') {
    throw new Error('Backend URL is not configured. Set REACT_APP_API_URL to the Render backend URL in Vercel and redeploy.');
  }
  const token = sessionStorage.getItem('bcd_validator_session');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

apiClient.interceptors.response.use(response => {
  if (typeof response.data === 'string' && /<\s*(?:!doctype|html)/i.test(response.data)) {
    throw new Error('The API returned a web page instead of project data. Check REACT_APP_API_URL in Vercel and redeploy.');
  }
  return response;
});

export default apiClient;
export { API_BASE_URL };
