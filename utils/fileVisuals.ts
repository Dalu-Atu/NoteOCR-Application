
export type FileCategory = "word" | "excel" | "pdf" | "other";

export interface FileVisual {
  category: FileCategory;
  icon:
    | "file-word-box"
    | "file-excel-box"
    | "file-pdf-box"
    | "file-document-outline";
  color: string;
}

export function getFileVisual(filename: string): FileVisual {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "doc" || ext === "docx") {
    return { category: "word", icon: "file-word-box", color: "#2563eb" };
  }
  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return { category: "excel", icon: "file-excel-box", color: "#16a34a" };
  }
  if (ext === "pdf") {
    return { category: "pdf", icon: "file-pdf-box", color: "#dc2626" };
  }
  return { category: "other", icon: "file-document-outline", color: "#71717a" };
}

// "1.2 MB" / "450 KB" -> comparable megabyte number, for sorting by size.
export function parseSizeToMB(size: string): number {
  const match = size.match(/([\d.]+)\s*(KB|MB|GB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "GB") return value * 1024;
  if (unit === "KB") return value / 1024;
  return value;
}
