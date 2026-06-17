import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Customer,
  Order,
  WindowItem,
  InstallationPhoto,
  OrderStatus,
  PaymentRecord,
  PaymentType,
} from "./types";
import {
  mockCustomers,
  mockOrders,
  mockWindowItems,
  mockPhotos,
  mockPayments,
} from "./initialData";
import { generateId, generateOrderNo, calcOrderSummary } from "@/utils";

interface WindowItemInput {
  widthMm: number;
  heightMm: number;
  profileColor: string;
  glassType: "single" | "double";
  hardwareBrand: string;
  unitPrice: number;
  quantity: number;
}

interface OrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerId?: string;
  items: WindowItemInput[];
  remark?: string;
}

interface AppState {
  customers: Customer[];
  orders: Order[];
  windowItems: WindowItem[];
  photos: InstallationPhoto[];
  payments: PaymentRecord[];

  getCustomerById: (id: string) => Customer | undefined;
  getOrderById: (id: string) => Order | undefined;
  getItemsByOrderId: (orderId: string) => WindowItem[];
  getPhotosByOrderId: (orderId: string) => InstallationPhoto[];
  getPaymentsByOrderId: (orderId: string) => PaymentRecord[];
  getOrdersByCustomerId: (customerId: string) => Order[];
  findCustomerByPhone: (phone: string) => Customer | undefined;
  getTotalPaidByOrderId: (orderId: string) => number;

  createOrder: (input: OrderInput) => Order;
  updateOrder: (id: string, input: Partial<OrderInput>) => void;
  deleteOrder: (id: string) => void;
  advanceOrderStatus: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;

  addInstallationPhoto: (orderId: string, dataUrl: string) => void;
  removeInstallationPhoto: (photoId: string) => void;

  addPayment: (orderId: string, input: {
    amount: number;
    paymentType: PaymentType;
    paymentDate: string;
    remark?: string;
  }) => void;
  removePayment: (paymentId: string) => void;

  resetAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,
      orders: mockOrders,
      windowItems: mockWindowItems,
      photos: mockPhotos,
      payments: mockPayments,

      getCustomerById: (id) => get().customers.find((c) => c.id === id),
      getOrderById: (id) => get().orders.find((o) => o.id === id),
      getItemsByOrderId: (orderId) =>
        get().windowItems.filter((w) => w.orderId === orderId),
      getPhotosByOrderId: (orderId) =>
        get().photos.filter((p) => p.orderId === orderId),
      getPaymentsByOrderId: (orderId) =>
        get().payments.filter((p) => p.orderId === orderId),
      getOrdersByCustomerId: (customerId) =>
        get().orders.filter((o) => o.customerId === customerId),
      findCustomerByPhone: (phone) =>
        get().customers.find((c) => c.phone === phone),
      getTotalPaidByOrderId: (orderId) =>
        get()
          .payments.filter((p) => p.orderId === orderId)
          .reduce((sum, p) => sum + p.amount, 0),

      createOrder: (input) => {
        const state = get();
        const now = new Date().toISOString();

        let customerId = input.customerId;
        if (!customerId) {
          const existing = state.customers.find(
            (c) => c.phone === input.customerPhone
          );
          if (existing) {
            customerId = existing.id;
          } else {
            const newCustomer: Customer = {
              id: generateId("cust-"),
              name: input.customerName,
              phone: input.customerPhone,
              address: input.customerAddress,
              createdAt: now,
            };
            set({ customers: [...state.customers, newCustomer] });
            customerId = newCustomer.id;
          }
        }

        const orderId = generateId("ord-");
        const orderNo = generateOrderNo();
        const items = input.items.map((item) => ({
          ...item,
          id: generateId("wi-"),
          orderId,
        }));
        const summary = calcOrderSummary(items as WindowItem[]);

        const newOrder: Order = {
          id: orderId,
          customerId,
          orderNo,
          status: "placed",
          totalAmount: summary.totalAmount,
          totalProfileMeters: summary.totalProfileMeters,
          totalGlassArea: summary.totalGlassArea,
          createdAt: now,
          updatedAt: now,
          remark: input.remark,
        };

        set({
          orders: [newOrder, ...state.orders],
          windowItems: [...state.windowItems, ...items],
        });

        return newOrder;
      },

      updateOrder: (id, input) => {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order) return;

        const now = new Date().toISOString();
        let customerId = order.customerId;

        if (input.customerPhone) {
          const existing = state.customers.find(
            (c) => c.phone === input.customerPhone
          );
          if (existing) {
            customerId = existing.id;
            if (
              input.customerName ||
              input.customerAddress !== undefined
            ) {
              set({
                customers: state.customers.map((c) =>
                  c.id === existing.id
                    ? {
                        ...c,
                        name: input.customerName ?? c.name,
                        address: input.customerAddress ?? c.address,
                      }
                    : c
                ),
              });
            }
          } else {
            const newCustomer: Customer = {
              id: generateId("cust-"),
              name: input.customerName ?? "",
              phone: input.customerPhone,
              address: input.customerAddress ?? "",
              createdAt: now,
            };
            set({ customers: [...state.customers, newCustomer] });
            customerId = newCustomer.id;
          }
        }

        let updatedOrder = { ...order, updatedAt: now, customerId, remark: input.remark ?? order.remark };

        if (input.items) {
          const items = input.items.map((item, idx) => ({
            ...item,
            id: state.windowItems.find((w, i) => w.orderId === id && i === idx)?.id ?? generateId("wi-"),
            orderId: id,
          }));
          const summary = calcOrderSummary(items as WindowItem[]);
          updatedOrder = {
            ...updatedOrder,
            totalAmount: summary.totalAmount,
            totalProfileMeters: summary.totalProfileMeters,
            totalGlassArea: summary.totalGlassArea,
          };
          const otherItems = state.windowItems.filter((w) => w.orderId !== id);
          set({ windowItems: [...otherItems, ...items] });
        }

        set({
          orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        });
      },

      deleteOrder: (id) => {
        const state = get();
        set({
          orders: state.orders.filter((o) => o.id !== id),
          windowItems: state.windowItems.filter((w) => w.orderId !== id),
          photos: state.photos.filter((p) => p.orderId !== id),
          payments: state.payments.filter((p) => p.orderId !== id),
        });
      },

      advanceOrderStatus: (id) => {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order) return;

        const statusOrder: OrderStatus[] = [
          "placed",
          "producing",
          "shipped",
          "installing",
          "completed",
        ];
        const currentIdx = statusOrder.indexOf(order.status);
        if (currentIdx >= statusOrder.length - 1) return;

        const nextStatus = statusOrder[currentIdx + 1];
        const now = new Date().toISOString();
        set({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: nextStatus,
                  updatedAt: now,
                  completedAt: nextStatus === "completed" ? now : o.completedAt,
                }
              : o
          ),
        });
      },

      setOrderStatus: (id, status) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  updatedAt: now,
                  completedAt: status === "completed" ? now : o.completedAt,
                }
              : o
          ),
        });
      },

      addInstallationPhoto: (orderId, dataUrl) => {
        const state = get();
        const photo: InstallationPhoto = {
          id: generateId("photo-"),
          orderId,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        set({ photos: [...state.photos, photo] });
      },

      removeInstallationPhoto: (photoId) => {
        const state = get();
        set({ photos: state.photos.filter((p) => p.id !== photoId) });
      },

      addPayment: (orderId, input) => {
        const state = get();
        const payment: PaymentRecord = {
          id: generateId("pay-"),
          orderId,
          amount: input.amount,
          paymentType: input.paymentType,
          paymentDate: input.paymentDate,
          remark: input.remark,
          createdAt: new Date().toISOString(),
        };
        set({ payments: [...state.payments, payment] });
      },

      removePayment: (paymentId) => {
        const state = get();
        set({ payments: state.payments.filter((p) => p.id !== paymentId) });
      },

      resetAllData: () => {
        set({
          customers: mockCustomers,
          orders: mockOrders,
          windowItems: mockWindowItems,
          photos: mockPhotos,
          payments: mockPayments,
        });
      },
    }),
    {
      name: "door-window-order-storage",
    }
  )
);
