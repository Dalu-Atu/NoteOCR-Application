import { api } from "./api";

export interface UploadDocumentParams {
  userId: string;
  folderName: string;
  fileName: string;
  mimeType: string;
  // Native (iOS/Android): a real file:// path from expo-document-picker.
  fileUri?: string;
  // Web: expo-document-picker returns an actual browser File on `.file` —
  // there is no usable filesystem path on web, only a blob: URL, which the
  // browser's FormData cannot upload directly.
  webFile?: File;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  document: {
    name: string;
    type: string;
    size: number;
    updatedAt: string;
    dest: string; // folder name — same key your create-document response uses
  };
}

export const uploadDocument = async (
  params: UploadDocumentParams,
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append("userId", params.userId);
  formData.append("folderName", params.folderName);

  if (params.webFile instanceof File) {
    // Web: append the real File/Blob. The browser sets the correct
    // multipart part headers (filename + content-type) automatically.
    formData.append("file", params.webFile, params.fileName);
  } else {
    if (!params.fileUri) {
      throw new Error(
        "uploadDocument: no fileUri (native) or webFile (web) was provided",
      );
    }
    // Native: React Native's FormData expects this specific shape for
    // files — not a real Blob/File object like on web.
    formData.append("file", {
      uri: params.fileUri,
      name: params.fileName,
      type: params.mimeType,
    } as any);
  }

  // Let the browser / RN networking layer set Content-Type with the
  // correct multipart boundary — axios does this automatically as long as
  // no default Content-Type header is already forcing a different value.
  const response = await api.post("/users/upload", formData, {
    headers: { Accept: "application/json" },
    // Uploads can take longer than the shared 15s CRUD default,
    // especially on slower connections — same reasoning as transcribe.
    timeout: 60000,
  });
  return response.data;
};
