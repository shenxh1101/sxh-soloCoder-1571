import type { WindowItem } from "@/store/types";

export const calcItemProfileMeters = (widthMm: number, heightMm: number): number => {
  return ((widthMm + heightMm) * 2) / 1000;
};

export const calcItemGlassArea = (widthMm: number, heightMm: number): number => {
  return (widthMm * heightMm) / 1000000;
};

export interface OrderSummary {
  totalProfileMeters: number;
  totalGlassArea: number;
  totalAmount: number;
}

export const calcOrderSummary = (items: WindowItem[]): OrderSummary => {
  let totalProfile = 0;
  let totalGlass = 0;
  let totalAmount = 0;

  for (const item of items) {
    const profile = calcItemProfileMeters(item.widthMm, item.heightMm);
    const glass = calcItemGlassArea(item.widthMm, item.heightMm);
    totalProfile += profile * item.quantity;
    totalGlass += glass * item.quantity;
    totalAmount += item.unitPrice * item.quantity;
  }

  return {
    totalProfileMeters: Math.round(totalProfile * 100) / 100,
    totalGlassArea: Math.round(totalGlass * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateId = (prefix = ""): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
};

export const generateOrderNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `MC${year}${month}${day}${suffix}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const exportToCsv = (
  rows: Record<string, any>[],
  filename: string
): void => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str =
            val === null || val === undefined
              ? ""
              : typeof val === "string"
              ? val.replace(/"/g, '""')
              : String(val);
          return `"${str}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
