import { api } from "./api";

export type ConversionType = "imageToWord" | "imageToExcel";

export interface TranscribePayload {
  images: string[]; // base64 data URIs
  userId: string;
  conversionType: ConversionType;
  documentName: string;
  folder: string;
  updating?: boolean;
}

export interface TranscribeResponse {
  success: boolean;
  message: string;
  document: {
    name: string;
    folder: string;
    userId: string;
    pages: number;
    blocks: number;
  };
}

export const transcribeImages = async (
  payload: TranscribePayload,
  timeoutMs = 120000,
): Promise<TranscribeResponse> => {
  // Conversion is a real AI job (20s+ per image is normal, not a bug) —
  // the shared axios instance's 15s default timeout exists for quick
  // CRUD calls and would abort this request while the backend is still
  // working. Override per-request instead of raising the global default.
  const response = await api.post("/transcribe/process-image", payload, {
    timeout: timeoutMs,
  });
  return response.data;
};
