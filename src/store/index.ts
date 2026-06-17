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
  InstallationAppointment,
  FollowUpRecord,
  ContractConfirmation,
  InspectionRecord,
  InspectionResult,
  AfterSalesTicket,
  AfterSalesStatus,
} from "./types";
import {
  mockCustomers,
  mockOrders,
  mockWindowItems,
  mockPhotos,
  mockPayments,
  mockAppointments,
  mockFollowUps,
  mockContracts,
  mockInspections,
  mockAfterSalesTickets,
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
  appointments: InstallationAppointment[];
  followUps: FollowUpRecord[];
  contracts: ContractConfirmation[];
  inspections: InspectionRecord[];
  afterSalesTickets: AfterSalesTicket[];

  getCustomerById: (id: string) => Customer | undefined;
  getOrderById: (id: string) => Order | undefined;
  getItemsByOrderId: (orderId: string) => WindowItem[];
  getPhotosByOrderId: (orderId: string) => InstallationPhoto[];
  getPaymentsByOrderId: (orderId: string) => PaymentRecord[];
  getOrdersByCustomerId: (customerId: string) => Order[];
  findCustomerByPhone: (phone: string) => Customer | undefined;
  getTotalPaidByOrderId: (orderId: string) => number;
  getAppointmentByOrderId: (orderId: string) => InstallationAppointment | undefined;
  getAppointmentsByDateRange: (startDate: string, endDate: string) => InstallationAppointment[];
  getFollowUpsByCustomerId: (customerId: string) => FollowUpRecord[];
  getContractByOrderId: (orderId: string) => ContractConfirmation | undefined;
  getInspectionByOrderId: (orderId: string) => InspectionRecord | undefined;
  getAfterSalesTicketsByCustomerId: (customerId: string) => AfterSalesTicket[];
  getAfterSalesTicketsByOrderId: (orderId: string) => AfterSalesTicket[];

  createOrder: (input: OrderInput) => Order;
  updateOrder: (id: string, input: Partial<OrderInput>) => void;
  deleteOrder: (id: string) => void;
  advanceOrderStatus: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setPaymentDueDate: (id: string, dueDate: string) => void;

  addInstallationPhoto: (orderId: string, dataUrl: string) => void;
  removeInstallationPhoto: (photoId: string) => void;

  addPayment: (orderId: string, input: {
    amount: number;
    paymentType: PaymentType;
    paymentDate: string;
    remark?: string;
  }) => void;
  removePayment: (paymentId: string) => void;

  setAppointment: (orderId: string, input: {
    appointmentDate: string;
    installer: string;
    remark?: string;
  }) => void;
  removeAppointment: (appointmentId: string) => void;

  addFollowUp: (customerId: string, input: {
    contactDate: string;
    content: string;
    result: string;
    nextFollowUpDate?: string;
  }) => void;
  removeFollowUp: (followUpId: string) => void;

  setContract: (orderId: string, input: {
    paymentTerms: string;
    installationTerms: string;
    warrantyMonths: number;
    customerSignature?: string;
    signedAt?: string;
  }) => void;
  removeContract: (contractId: string) => void;

  setInspection: (orderId: string, input: {
    inspectionDate: string;
    result: InspectionResult;
    customerFeedback: string;
    needsRework: boolean;
    reworkReason?: string;
    reworkProgress?: string;
    reworkCompletedAt?: string;
  }) => void;
  updateInspectionRework: (inspectionId: string, reworkProgress: string, completed?: boolean) => void;
  removeInspection: (inspectionId: string) => void;

  addAfterSalesTicket: (input: {
    customerId: string;
    orderId?: string;
    issueType: string;
    description: string;
    appointmentDate?: string;
    handler?: string;
  }) => void;
  updateAfterSalesStatus: (ticketId: string, status: AfterSalesStatus, result?: string) => void;
  removeAfterSalesTicket: (ticketId: string) => void;

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
      appointments: mockAppointments,
      followUps: mockFollowUps,
      contracts: mockContracts,
      inspections: mockInspections,
      afterSalesTickets: mockAfterSalesTickets,

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
      getAppointmentByOrderId: (orderId) =>
        get().appointments.find((a) => a.orderId === orderId),
      getAppointmentsByDateRange: (startDate, endDate) =>
        get().appointments.filter(
          (a) => a.appointmentDate >= startDate && a.appointmentDate <= endDate
        ),
      getFollowUpsByCustomerId: (customerId) =>
        get()
          .followUps.filter((f) => f.customerId === customerId)
          .sort((a, b) => new Date(b.contactDate).getTime() - new Date(a.contactDate).getTime()),
      getContractByOrderId: (orderId) =>
        get().contracts.find((c) => c.orderId === orderId),
      getInspectionByOrderId: (orderId) =>
        get().inspections.find((i) => i.orderId === orderId),
      getAfterSalesTicketsByCustomerId: (customerId) =>
        get()
          .afterSalesTickets.filter((t) => t.customerId === customerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      getAfterSalesTicketsByOrderId: (orderId) =>
        get()
          .afterSalesTickets.filter((t) => t.orderId === orderId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

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

      setPaymentDueDate: (id, dueDate) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, paymentDueDate: dueDate, updatedAt: now } : o
          ),
        });
      },

      setAppointment: (orderId, input) => {
        const state = get();
        const now = new Date().toISOString();
        const existing = state.appointments.find((a) => a.orderId === orderId);

        if (existing) {
          set({
            appointments: state.appointments.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    appointmentDate: input.appointmentDate,
                    installer: input.installer,
                    remark: input.remark,
                    updatedAt: now,
                  }
                : a
            ),
          });
        } else {
          const newAppointment: InstallationAppointment = {
            id: generateId("apt-"),
            orderId,
            appointmentDate: input.appointmentDate,
            installer: input.installer,
            remark: input.remark,
            createdAt: now,
            updatedAt: now,
          };
          set({ appointments: [...state.appointments, newAppointment] });
        }
      },

      removeAppointment: (appointmentId) => {
        const state = get();
        set({
          appointments: state.appointments.filter((a) => a.id !== appointmentId),
        });
      },

      addFollowUp: (customerId, input) => {
        const state = get();
        const newFollowUp: FollowUpRecord = {
          id: generateId("fu-"),
          customerId,
          contactDate: input.contactDate,
          content: input.content,
          result: input.result,
          nextFollowUpDate: input.nextFollowUpDate,
          createdAt: new Date().toISOString(),
        };
        set({ followUps: [...state.followUps, newFollowUp] });
      },

      removeFollowUp: (followUpId) => {
        const state = get();
        set({ followUps: state.followUps.filter((f) => f.id !== followUpId) });
      },

      setContract: (orderId, input) => {
        const state = get();
        const now = new Date().toISOString();
        const existing = state.contracts.find((c) => c.orderId === orderId);

        if (existing) {
          set({
            contracts: state.contracts.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    paymentTerms: input.paymentTerms,
                    installationTerms: input.installationTerms,
                    warrantyMonths: input.warrantyMonths,
                    customerSignature: input.customerSignature,
                    signedAt: input.signedAt,
                    updatedAt: now,
                  }
                : c
            ),
          });
        } else {
          const newContract: ContractConfirmation = {
            id: generateId("contract-"),
            orderId,
            paymentTerms: input.paymentTerms,
            installationTerms: input.installationTerms,
            warrantyMonths: input.warrantyMonths,
            customerSignature: input.customerSignature,
            signedAt: input.signedAt,
            createdAt: now,
            updatedAt: now,
          };
          set({ contracts: [...state.contracts, newContract] });
        }
      },

      removeContract: (contractId) => {
        const state = get();
        set({ contracts: state.contracts.filter((c) => c.id !== contractId) });
      },

      setInspection: (orderId, input) => {
        const state = get();
        const now = new Date().toISOString();
        const existing = state.inspections.find((i) => i.orderId === orderId);

        if (existing) {
          set({
            inspections: state.inspections.map((i) =>
              i.id === existing.id
                ? {
                    ...i,
                    inspectionDate: input.inspectionDate,
                    result: input.result,
                    customerFeedback: input.customerFeedback,
                    needsRework: input.needsRework,
                    reworkReason: input.reworkReason,
                    reworkProgress: input.reworkProgress,
                    reworkCompletedAt: input.reworkCompletedAt,
                    updatedAt: now,
                  }
                : i
            ),
          });
        } else {
          const newInspection: InspectionRecord = {
            id: generateId("insp-"),
            orderId,
            inspectionDate: input.inspectionDate,
            result: input.result,
            customerFeedback: input.customerFeedback,
            needsRework: input.needsRework,
            reworkReason: input.reworkReason,
            reworkProgress: input.reworkProgress,
            reworkCompletedAt: input.reworkCompletedAt,
            createdAt: now,
            updatedAt: now,
          };
          set({ inspections: [...state.inspections, newInspection] });
        }
      },

      updateInspectionRework: (inspectionId, reworkProgress, completed) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          inspections: state.inspections.map((i) =>
            i.id === inspectionId
              ? {
                  ...i,
                  reworkProgress,
                  reworkCompletedAt: completed ? now : i.reworkCompletedAt,
                  result: completed ? "pass" : i.result,
                  updatedAt: now,
                }
              : i
          ),
        });
      },

      removeInspection: (inspectionId) => {
        const state = get();
        set({ inspections: state.inspections.filter((i) => i.id !== inspectionId) });
      },

      addAfterSalesTicket: (input) => {
        const state = get();
        const now = new Date().toISOString();
        const newTicket: AfterSalesTicket = {
          id: generateId("as-"),
          customerId: input.customerId,
          orderId: input.orderId,
          issueType: input.issueType,
          description: input.description,
          appointmentDate: input.appointmentDate,
          handler: input.handler,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };
        set({ afterSalesTickets: [...state.afterSalesTickets, newTicket] });
      },

      updateAfterSalesStatus: (ticketId, status, result) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          afterSalesTickets: state.afterSalesTickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  result: result ?? t.result,
                  completedAt: status === "completed" ? now : t.completedAt,
                  updatedAt: now,
                }
              : t
          ),
        });
      },

      removeAfterSalesTicket: (ticketId) => {
        const state = get();
        set({ afterSalesTickets: state.afterSalesTickets.filter((t) => t.id !== ticketId) });
      },

      deleteOrder: (id) => {
        const state = get();
        set({
          orders: state.orders.filter((o) => o.id !== id),
          windowItems: state.windowItems.filter((w) => w.orderId !== id),
          photos: state.photos.filter((p) => p.orderId !== id),
          payments: state.payments.filter((p) => p.orderId !== id),
          appointments: state.appointments.filter((a) => a.orderId !== id),
          contracts: state.contracts.filter((c) => c.orderId !== id),
          inspections: state.inspections.filter((i) => i.orderId !== id),
          afterSalesTickets: state.afterSalesTickets.filter((t) => t.orderId !== id),
        });
      },

      resetAllData: () => {
        set({
          customers: mockCustomers,
          orders: mockOrders,
          windowItems: mockWindowItems,
          photos: mockPhotos,
          payments: mockPayments,
          appointments: mockAppointments,
          followUps: mockFollowUps,
          contracts: mockContracts,
          inspections: mockInspections,
          afterSalesTickets: mockAfterSalesTickets,
        });
      },
    }),
    {
      name: "door-window-order-storage",
    }
  )
);
