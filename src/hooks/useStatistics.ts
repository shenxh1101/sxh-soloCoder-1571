import { useMemo } from "react";
import { useStore } from "@/store";
import type { Order, OrderStatus } from "@/store/types";
import { STATUS_FLOW } from "@/store/types";

export interface StatisticsData {
  totalOrders: number;
  pendingInstall: number;
  monthRevenue: number;
  avgOrderAmount: number;
  statusCounts: Record<OrderStatus, number>;
  recentOrders: (Order & { customerName: string })[];
  monthOrders: number;
}

export function useStatistics(): StatisticsData {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);

  return useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startOfMonth
    );

    const statusCounts = STATUS_FLOW.reduce((acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((o) => ({
        ...o,
        customerName: customerMap.get(o.customerId) ?? "未知客户",
      }));

    const totalRevenue = orders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const monthRevenue = monthOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    return {
      totalOrders: orders.length,
      pendingInstall: statusCounts.installing + statusCounts.shipped + statusCounts.producing,
      monthRevenue,
      avgOrderAmount: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      statusCounts,
      recentOrders,
      monthOrders: monthOrders.length,
    };
  }, [orders, customers]);
}

export interface MonthlyStats {
  labels: string[];
  orderCounts: number[];
  revenues: number[];
}

export function useMonthlyStats(months = 6): MonthlyStats {
  const orders = useStore((s) => s.orders);

  return useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const orderCounts: number[] = [];
    const revenues: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;

      const monthOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= date && d < nextDate;
      });

      labels.push(label);
      orderCounts.push(monthOrders.length);
      revenues.push(
        Math.round(monthOrders.reduce((sum, o) => sum + o.totalAmount, 0))
      );
    }

    return { labels, orderCounts, revenues };
  }, [orders, months]);
}

export interface ColorRankItem {
  color: string;
  count: number;
  meters: number;
}

export function useColorRank(): ColorRankItem[] {
  const windowItems = useStore((s) => s.windowItems);
  const orders = useStore((s) => s.orders);

  return useMemo(() => {
    const orderIds = new Set(orders.map((o) => o.id));
    const colorMap = new Map<
      string,
      { count: number; meters: number }
    >();

    for (const item of windowItems) {
      if (!orderIds.has(item.orderId)) continue;
      const existing = colorMap.get(item.profileColor) ?? {
        count: 0,
        meters: 0,
      };
      const perimeter =
        ((item.widthMm + item.heightMm) * 2 * item.quantity) / 1000;
      colorMap.set(item.profileColor, {
        count: existing.count + item.quantity,
        meters: existing.meters + perimeter,
      });
    }

    return [...colorMap.entries()]
      .map(([color, data]) => ({
        color,
        count: data.count,
        meters: Math.round(data.meters * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [windowItems, orders]);
}

export interface GlassStats {
  single: number;
  double: number;
}

export function useGlassStats(): GlassStats {
  const windowItems = useStore((s) => s.windowItems);
  const orders = useStore((s) => s.orders);

  return useMemo(() => {
    const orderIds = new Set(orders.map((o) => o.id));
    let single = 0;
    let double = 0;

    for (const item of windowItems) {
      if (!orderIds.has(item.orderId)) continue;
      if (item.glassType === "single") single += item.quantity;
      else double += item.quantity;
    }

    return { single, double };
  }, [windowItems, orders]);
}
