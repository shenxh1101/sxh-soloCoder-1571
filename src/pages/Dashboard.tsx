import { Link } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ClipboardList,
  Hammer,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
} from "lucide-react";
import { useStatistics, useMonthlyStats } from "@/hooks/useStatistics";
import { useStore } from "@/store";
import { STATUS_LABELS, STATUS_COLORS, STATUS_FLOW } from "@/store/types";
import StatusBadge from "@/components/order/StatusBadge";
import { formatCurrency, formatDate } from "@/utils";

const statCards = [
  {
    key: "totalOrders",
    label: "订单总数",
    icon: ClipboardList,
    suffix: "单",
  },
  {
    key: "pendingInstall",
    label: "待处理订单",
    icon: Hammer,
    suffix: "单",
  },
  {
    key: "monthRevenue",
    label: "本月营收",
    icon: DollarSign,
    isMoney: true,
  },
  {
    key: "avgOrderAmount",
    label: "平均客单价",
    icon: TrendingUp,
    isMoney: true,
  },
];

export default function Dashboard() {
  const stats = useStatistics();
  const monthly = useMonthlyStats(6);
  const getCustomerById = useStore((s) => s.getCustomerById);

  const pieOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c}单 ({d}%)" },
    legend: {
      bottom: 0,
      textStyle: { color: "#5D4037", fontSize: 12, fontFamily: "Noto Sans SC" },
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["55%", "75%"],
        center: ["50%", "42%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 600,
            color: "#5D4037",
          },
        },
        data: STATUS_FLOW.map((s) => ({
          value: stats.statusCounts[s],
          name: STATUS_LABELS[s],
          itemStyle: { color: getComputedStyle(document.documentElement).getPropertyValue(`--tw-${STATUS_COLORS[s].replace("bg-", "")}`) || statusColorHex(s) },
        })),
      },
    ],
  };

  const barOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(93,64,55,0.95)",
      borderWidth: 0,
      textStyle: { color: "#fff" },
    },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: "category",
      data: monthly.labels,
      axisLine: { lineStyle: { color: "#D4BEA1" } },
      axisLabel: { color: "#5D4037", fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#9A7149", fontSize: 11 },
      splitLine: { lineStyle: { color: "#F4EDE0", type: "dashed" } },
    },
    series: [
      {
        name: "订单数",
        type: "bar",
        data: monthly.orderCounts,
        barWidth: 28,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#C9A961" },
              { offset: 1, color: "#E6CE8B" },
            ],
          },
        },
      },
    ],
  };

  const lineOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(93,64,55,0.95)",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>营收: ¥${p.value.toLocaleString()}`;
      },
    },
    grid: { left: 55, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category",
      data: monthly.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#D4BEA1" } },
      axisLabel: { color: "#5D4037", fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: {
        color: "#9A7149",
        fontSize: 11,
        formatter: (v: number) => `${v / 10000}万`,
      },
      splitLine: { lineStyle: { color: "#F4EDE0", type: "dashed" } },
    },
    series: [
      {
        name: "营收",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        data: monthly.revenues,
        lineStyle: { width: 3, color: "#5D4037" },
        itemStyle: { color: "#C9A961", borderColor: "#5D4037", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(201,169,97,0.35)" },
              { offset: 1, color: "rgba(201,169,97,0.02)" },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800 mb-1">
            欢迎回来 👋
          </h1>
          <p className="text-walnut-500">
            今天是 {formatDate(new Date().toISOString())}，本月共接 {stats.monthOrders} 单
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/customers" className="btn-secondary flex items-center gap-2">
            <Search className="w-4 h-4" /> 查询客户
          </Link>
          <Link to="/orders/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新建订单
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {statCards.map((c) => {
          const Icon = c.icon;
          const rawVal = (stats as any)[c.key] as number;
          const display = c.isMoney
            ? formatCurrency(rawVal)
            : `${rawVal.toLocaleString()}${c.suffix || ""}`;
          return (
            <div
              key={c.key}
              className="relative overflow-hidden rounded-xl2 bg-walnut-gradient p-6 shadow-copper hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-copper-200" />
                  </div>
                </div>
                <div className="text-3xl font-serif font-bold text-white mb-1">
                  {display}
                </div>
                <div className="text-copper-200/90 text-sm">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card p-6">
          <h3 className="section-title mb-4">订单状态分布</h3>
          <ReactECharts option={pieOption} style={{ height: 260 }} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">近6月订单趋势</h3>
          <ReactECharts option={barOption} style={{ height: 260 }} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">营收走势</h3>
          <ReactECharts option={lineOption} style={{ height: 260 }} />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">最近订单</h3>
          <Link
            to="/orders"
            className="text-sm text-copper-600 hover:text-copper-700 font-medium"
          >
            查看全部 →
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-walnut-400 border-b border-walnut-100">
              <th className="pb-3 font-medium">订单号</th>
              <th className="pb-3 font-medium">客户</th>
              <th className="pb-3 font-medium">地址</th>
              <th className="pb-3 font-medium">下单日期</th>
              <th className="pb-3 font-medium">金额</th>
              <th className="pb-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map((order) => {
              const customer = getCustomerById(order.customerId);
              return (
                <tr
                  key={order.id}
                  className="border-b border-walnut-50 last:border-0 hover:bg-cream-50/50 transition-colors"
                >
                  <td className="py-4 text-sm font-mono text-walnut-600">
                    {order.orderNo}
                  </td>
                  <td className="py-4 text-sm font-medium text-walnut-800">
                    {customer?.name}
                  </td>
                  <td className="py-4 text-sm text-walnut-500 max-w-[280px] truncate">
                    {customer?.address}
                  </td>
                  <td className="py-4 text-sm text-walnut-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-4 text-sm font-semibold text-copper-600">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusColorHex(s: string): string {
  const map: Record<string, string> = {
    placed: "#6B7280",
    producing: "#3B82F6",
    shipped: "#8B5CF6",
    installing: "#F59E0B",
    completed: "#10B981",
  };
  return map[s] || "#999";
}
