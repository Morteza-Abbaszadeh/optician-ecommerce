import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const parsedData = JSON.parse(authStorage);
          const token = parsedData?.state?.token;
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);