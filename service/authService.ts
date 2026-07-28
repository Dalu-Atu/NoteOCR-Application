// services/authService.ts
import { api } from "./api";

export const signup = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/signup", userData);
  return response.data; //
};

export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", credentials);
  console.log(response.data);
  return response.data;
};

export const checkAuth = async (token: string) => {
  const response = await api.post("/auth/check-auth", { token });
  return response.data;
};

// export const verifyEmail = async (credentials) => {
//   const response = await axios.post(
//     `${import.meta.env.VITE_API_URL}/auth/verify-email`,
//     credentials,
//   );
//   return response.data;
// };
// export const forgotPassword = async (data) => {
//   const response = await axios.post(
//     `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
//     data,
//   );
//   return response.data;
// };

// export const resetPassword = async (data) => {
//   const response = await axios.post(
//     `${import.meta.env.VITE_API_URL}/auth/reset-password`,
//     data,
//   );
//   return response.data;
// };
