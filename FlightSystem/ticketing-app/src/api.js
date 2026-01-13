import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: false,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const oidcStorage = sessionStorage.getItem(`oidc.user:https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_EqOhYKs8N:5a536lkrvrnaolvdlopej7oj8c`);
  if (oidcStorage) {
    const user = JSON.parse(oidcStorage);
    config.headers.Authorization = `Bearer ${user.id_token}`;
  }
  return config;
});

export default api;