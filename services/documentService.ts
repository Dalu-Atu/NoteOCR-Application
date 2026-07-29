import { api } from "./api";

export const deleteFile = async (params: {
  id: string;
  folder: string;
  file: string; // filename
}) => {
  const response = await api.post("/users/delete-file", params);
  return response.data;
};

export const permanentDelete = async (params: { id: string; file: string }) => {
  const response = await api.post("/users/delete-permanently", params);
  return response.data;
};

export const recoverFile = async (params: {
  id: string;
  file: { name: string; dest: string }; // dest = folder to restore into
}) => {
  const response = await api.post("/users/recover-file", params);
  return response.data;
};

export const moveFile = async (params: {
  id: string;
  previousDestination: string;
  newDestination: string;
  file: string; // filename
}) => {
  const response = await api.post("/users/move-file", params);
  return response.data;
};

export const createDocument = async (params: {
  userId: string;
  folderName: string;
  documentName: string;
  fileType: string;
}) => {
  const response = await api.post("/users/create-document", params);
  return response.data;
};

export const uploadDocument = async (params: {
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
}) => {
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
  });
  return response.data;
};

export const renameFile = async (params: {
  id: string;
  folder: string;
  file: string; // current filename
  newName: string;
}) => {
  const response = await api.post("/users/rename-file", params);
  return response.data;
};