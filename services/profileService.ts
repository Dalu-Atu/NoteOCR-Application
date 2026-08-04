import { api } from "./api";

export const updateUserName = async (params: {
  userId: string;
  newName: string;
  currentPassword: string;
}) => {
  const response = await api.put("/users/update-name", params);
  return response.data as { success: boolean; message: string; user?: any };
};

export const updateUserEmail = async (params: {
  userId: string;
  newEmail: string;
  currentPassword: string;
}) => {
  const response = await api.put("/users/update-email", params);
  return response.data as { success: boolean; message: string; user?: any };
};

export const updateUserPassword = async (params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  const response = await api.put("/users/update-password", params);
  return response.data as { success: boolean; message: string };
};
