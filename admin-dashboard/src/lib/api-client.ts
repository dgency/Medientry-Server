import axios from 'axios';

import { authStorage } from './auth-storage';
import { getApiBaseUrl } from './media';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !String(error.config?.url ?? '').includes('/auth/login')
    ) {
      window.dispatchEvent(new CustomEvent('medientry:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export const extractApiData = <T,>(response: { data: ApiResponse<T> }) => response.data.data;

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string;
          errors?: {
            fieldErrors?: Record<string, string[] | undefined>;
          };
        }
      | undefined;
    const fieldErrors = responseData?.errors?.fieldErrors
      ? Object.entries(responseData.errors.fieldErrors)
          .flatMap(([field, messages]) =>
            (messages ?? []).filter(Boolean).map((message) => `${field}: ${message}`),
          )
      : [];

    return (
      (fieldErrors.length > 0
        ? fieldErrors.join(' ')
        : responseData?.message) ??
      error.message ??
      'Request failed.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
};
