import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
// Reuses your existing createDocument — same one useDocumentActions already
// imports from here for the web app's blank-document flow.
import { createDocument } from "@/services/documentService";
import { uploadDocument } from "@/services/UploadService";

export function useUploadDocument() {
  const { refreshUserData } = useAuth();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      refreshUserData();
    },
  });
}

export function useCreateBlankDocument() {
  const { refreshUserData } = useAuth();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      refreshUserData();
    },
  });
}
