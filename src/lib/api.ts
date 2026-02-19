import axios, { type AxiosError } from "axios";
import { AUTH_ROUTES } from "./auth-routes";

/**
 * Reusable axios instance for API requests.
 *
 * Use this instance throughout the application for non-streaming requests.
 * For streaming responses (e.g. chat), use fetch directly with response.body.
 */
export const api = axios.create({
  baseURL: "",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = AUTH_ROUTES.signIn;
      }
    }
    return Promise.reject(error);
  },
);
