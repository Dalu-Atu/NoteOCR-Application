import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  createFolder,
  deleteFolder,
  renameFolder,
} from "../services/folderService";

export function useFolderActions() {
  const { user, refreshUserData } = useAuth();

  const createFolderMutation = useMutation({
    mutationFn: (params: {
      folderName: string;
      description: string;
      color?: string;
    }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return createFolder({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });

  const renameFolderMutation = useMutation({
    mutationFn: (params: {
      folderId: string;
      newName?: string;
      color?: string;
    }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return renameFolder({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (params: { folderId: string }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return deleteFolder({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });

  return {
    createFolder: createFolderMutation,
    renameFolder: renameFolderMutation,
    deleteFolder: deleteFolderMutation,
  };
}
