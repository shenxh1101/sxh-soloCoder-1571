export type OrderStatus =
  | "placed"
  | "producing"
  | "shipped"
  | "installing"
  | "completed";

export type GlassType = "single" | "double";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface WindowItem {
  id: string;
  orderId: string;
  widthMm: number;
  heightMm: number;
  profileColor: string;
  glassType: GlassType;
  hardwareBrand: string;
  unitPrice: number;
  quantity: number;
}

export type PaymentType = "deposit" | "balance" | "installment" | "other";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  deposit: "定金",
  balance: "尾款",
  installment: "分期款",
  other: "其他",
};

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  remark?: string;
  createdAt: string;
}

export interface InstallationPhoto {
  id: string;
  orderId: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  totalProfileMeters: number;
  totalGlassArea: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  remark?: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "已下单",
  producing: "生产中",
  shipped: "已发货",
  installing: "待安装",
  completed: "已完工",
};

export const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "producing",
  "shipped",
  "installing",
  "completed",
];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "bg-status-placed",
  producing: "bg-status-producing",
  shipped: "bg-status-shipped",
  installing: "bg-status-installing",
  completed: "bg-status-completed",
};

export const GLASS_LABELS: Record<GlassType, string> = {
  single: "单层玻璃",
  double: "双层中空玻璃",
};

export const PROFILE_COLORS = [
  "深咖色",
  "砂灰色",
  "象牙白",
  "氟碳金",
  "红酸枝",
  "黄花梨",
  "香槟色",
  "墨绿色",
];

export const HARDWARE_BRANDS = [
  "好博 HOPO",
  "坚朗 KINLONG",
  "国强",
  "丝吉利娅",
  "诺托 ROTO",
  "合和",
  "春晖",
];
