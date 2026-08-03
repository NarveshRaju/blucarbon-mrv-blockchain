import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
export { API_BASE_URL };
