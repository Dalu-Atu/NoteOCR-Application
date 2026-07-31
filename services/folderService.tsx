import { api } from "./api";

export interface BackendFolder {
  _id: string;
  name: string;
  description: string;
  color?: string;
  documents: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export const createFolder = async (params: {
  userId: string;
  folderName: string;
  description: string;
  color?: string;
}) => {
  const response = await api.post("/users/create-folder", params);
  return response.data as { message: string; folder: BackendFolder };
};

export const renameFolder = async (params: {
  userId: string;
  folderId: string;
  newName?: string;
  color?: string;
}) => {
  const response = await api.post("/users/rename-folder", params);
  return response.data as { message: string; folder: BackendFolder };
};

export const deleteFolder = async (params: {
  userId: string;
  folderId: string;
}) => {
  const response = await api.post("/users/delete-folder", params);
  return response.data as {
    message: string;
    deletedDocumentCount: number;
  };
};
