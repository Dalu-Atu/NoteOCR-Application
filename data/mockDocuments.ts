export interface DocumentItem {
  id: string;
  title: string;
  date: string;
  folder: string;
  size: string;
}

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    title: "QleoOdE.docx",
    date: "Jun 14, 2026",
    folder: "Personal",
    size: "1.2 MB",
  },
  {
    id: "2",
    title: "notecor_table_178144.xlsx",
    date: "Jun 14, 2026",
    folder: "Personal",
    size: "450 KB",
  },
  {
    id: "3",
    title: "notecor_word_178144.docx",
    date: "Jun 14, 2026",
    folder: "Personal",
    size: "2.1 MB",
  },
  {
    id: "4",
    title: "CHAPTER-V-approved.pdf",
    date: "Jun 14, 2026",
    folder: "Personal",
    size: "3.8 MB",
  },
  {
    id: "5",
    title: "Project_Proposal_Draft.docx",
    date: "Jun 10, 2026",
    folder: "Work",
    size: "890 KB",
  },
  {
    id: "6",
    title: "Financial_Report_Q2.xlsx",
    date: "Jun 02, 2026",
    folder: "Finance",
    size: "1.5 MB",
  },
];

// Folder color tags are purely cosmetic metadata — independent of the
// documents themselves, since a folder can exist (and be colored) before
// it has anything inside it. "Scans" intentionally has zero matching
// documents above, so it doubles as a real test case for an empty folder.
export const FOLDER_COLORS: Record<string, string> = {
  Personal: "#10b981",
  Work: "#3b82f6",
  Finance: "#f97316",
  Scans: "#8b5cf6",
};
