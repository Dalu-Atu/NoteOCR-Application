import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  createDocument,
  deleteFile,
  moveFile,
  permanentDelete,
  recoverFile,
  renameFile,
  uploadDocument,
} from "../services/documentService";

export function useDocumentActions() {
  const { user, refreshUserData } = useAuth();

  const deleteMutation = useMutation({
    mutationFn: (params: { folder: string; file: string }) =>
      deleteFile({ id: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (params: { file: string }) =>
      permanentDelete({ id: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  const recoverMutation = useMutation({
    mutationFn: (params: { file: { name: string; dest: string } }) =>
      recoverFile({ id: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  const moveMutation = useMutation({
    mutationFn: (params: {
      previousDestination: string;
      newDestination: string;
      file: string;
    }) => moveFile({ id: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  const createDocumentMutation = useMutation({
    mutationFn: (params: {
      folderName: string;
      documentName: string;
      fileType: string;
    }) => createDocument({ userId: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  const uploadMutation = useMutation({
    mutationFn: (params: {
      folderName: string;
      fileName: string;
      mimeType: string;
      fileUri?: string; // native
      webFile?: File; // web
    }) => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return uploadDocument({ userId: user.id, ...params });
    },
    onSuccess: refreshUserData,
  });
  const renameMutation = useMutation({
    mutationFn: (params: { folder: string; file: string; newName: string }) =>
      renameFile({ id: user!.id, ...params }),
    onSuccess: refreshUserData,
  });

  return {
    deleteFile: deleteMutation,
    permanentDelete: permanentDeleteMutation,
    recoverFile: recoverMutation,
    moveFile: moveMutation,
    createDocument: createDocumentMutation,
    uploadFile: uploadMutation,
    renameFile: renameMutation,
  };
}
