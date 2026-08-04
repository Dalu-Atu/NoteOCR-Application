import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import {
  transcribeImages,
  TranscribePayload,
} from "@/services/transcribeService";

export function useTranscribe() {
  const { refreshUserData } = useAuth();

  return useMutation({
    mutationFn: ({
      payload,
      timeoutMs,
    }: {
      payload: TranscribePayload;
      timeoutMs?: number;
    }) => transcribeImages(payload, timeoutMs),
    onSuccess: (data) => {
        console.log("[useTranscribe] conversion succeeded:", data);
      // Keeps document counts, the recent list, and remainingPages in
      // sync with what the backend just changed — same pattern
      // useDocumentActions uses after delete/move/etc.
      refreshUserData();
    },onError: (err: any) => {
      console.error("[useTranscribe] conversion failed:", err);
    }
  });
}
