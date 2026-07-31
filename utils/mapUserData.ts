export interface DocumentItem {
  id: string;
  title: string;
  date: string;
  folder: string;
  size: string;
}

export interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
  color: string;
}

export interface TrashItem {
  id: string;
  title: string;
  type: string;
  // The folder this document lived in before it was deleted — this is
  // what gets passed back as `dest` to the recover-file endpoint so it
  // lands back where it came from.
  folder: string;
  size: string;
  daysRemaining: number;
  date: string;
}

export interface OverviewData {
  documentCount: number;
  folderCount: number;
  pagesRemaining: number;
  totalPages: number;
  pagesUsed: number;
  usagePercent: number;
  planLabel: string;
  isActive: boolean;
}

const PLAN_PAGES: Record<string, number> = {
  "STARTER Bundle": 100, // ⚠️ confirm this exact string with your other screenshot
  "PLUS Bundle": 300, // ⚠️ confirm this exact string with your other screenshot
  "PRO Bundle": 1000,
};

const FREE_BASELINE_PAGES = 2;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapDocuments(rawFolders: any[]): DocumentItem[] {
  if (!Array.isArray(rawFolders)) return [];

  const flattened = rawFolders.flatMap((folder) =>
    (folder.documents || []).map((doc: any) => ({
      id: doc._id,
      title: doc.name,
      date: formatDate(doc.updatedAt || doc.createdAt),
      folder: folder.name,
      size: formatBytes(doc.size),
      _sortDate: doc.updatedAt || doc.createdAt,
    })),
  );

  return flattened
    .sort(
      (a, b) =>
        new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime(),
    )
    .map(({ _sortDate, ...rest }) => rest);
}

export function mapFolders(rawFolders: any[]): FolderItem[] {
  if (!Array.isArray(rawFolders)) return [];
  return rawFolders.map((folder) => ({
    id: folder._id,
    name: folder.name,
    documentCount: folder.documents?.length || 0,
    color: folder.color || "#10b981",
  }));
}

// Trash entries come back from the backend with `name`, `type`,
// `lastEdited`, `size`, `dest` (the folder it was deleted from),
// `daysRemaining` (server-computed countdown to permanent purge), and
// `_id`. `data` (the raw file bytes) is intentionally never touched here
// — the trash list only needs metadata, not the binary payload.
export function mapTrash(rawTrash: any[]): TrashItem[] {
  if (!Array.isArray(rawTrash)) return [];

  const mapped = rawTrash.map((item) => ({
    id: item._id,
    title: item.name,
    type: item.type,
    folder: item.dest,
    size: formatBytes(item.size),
    daysRemaining:
      typeof item.daysRemaining === "number" ? item.daysRemaining : 0,
    date: formatDate(item.lastEdited || item.updatedAt || item.createdAt),
    _sortDate: item.lastEdited || item.updatedAt || item.createdAt,
  }));

  return mapped
    .sort(
      (a, b) =>
        new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime(),
    )
    .map(({ _sortDate, ...rest }) => rest);
}

function calculatePaidPages(transactions: any[]): number {
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((total, tx) => {
    if (tx.paymentStatus !== "paid") return total;
    const pages = PLAN_PAGES[tx.plan] || 0;
    return total + pages;
  }, 0);
}

export function mapOverview(raw: any): OverviewData {
  const folders = raw.folders || [];
  const documentCount = folders.reduce(
    (sum: number, f: any) => sum + (f.documents?.length || 0),
    0,
  );

  const totalPages =
    FREE_BASELINE_PAGES + calculatePaidPages(raw.transactions || []);
  const pagesRemaining = raw.subscription?.remainingPages ?? 0;
  const pagesUsed = Math.max(totalPages - pagesRemaining, 0);

  return {
    documentCount,
    folderCount: folders.length,
    pagesRemaining,
    totalPages,
    pagesUsed,
    usagePercent: totalPages > 0 ? pagesUsed / totalPages : 0,
    planLabel: raw.subscription?.plan ?? "Free",
    isActive: raw.subscription?.status === "active",
  };
}
