import { Link } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import {
  ClipboardList,
  Hammer,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  CalendarDays,
  HardHat,
  MapPin,
  Phone,
  AlertTriangle,
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
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const appointments = useStore((s) => s.appointments);

  const getCustomerById = (id: string) => customers.find((c) => c.id === id);

  const upcomingInstallations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    return appointments
      .filter((a) => {
        const aptDate = new Date(a.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && aptDate <= next7Days;
      })
      .map((a) => {
        const order = orders.find((o) => o.id === a.orderId);
        const customer = order ? customers.find((c) => c.id === order.customerId) : null;
        return { ...a, order, customer };
      })
      .filter((a) => a.order && a.customer)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [appointments, orders, customers]);

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

      <div className="card p-6 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-installing via-copper-500 to-status-installing" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <CalendarDays className="w-5 h-5 text-copper-500" /> 近期安装提醒
            {upcomingInstallations.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-status-installing/10 text-status-installing text-xs font-medium">
                {upcomingInstallations.length} 个待安装
              </span>
            )}
          </h3>
          <Link
            to="/orders?status=installing"
            className="text-sm text-copper-600 hover:text-copper-700 font-medium"
          >
            查看全部 →
          </Link>
        </div>

        {upcomingInstallations.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-walnut-300 text-4xl mb-3">✅</div>
            <p className="text-walnut-500">未来7天暂无安装安排</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingInstallations.map((apt) => {
              const aptDate = new Date(apt.appointmentDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;

              let dateLabel = formatDate(apt.appointmentDate);
              let dateBadgeClass = "bg-walnut-100 text-walnut-600";
              if (isToday) {
                dateLabel = "今天";
                dateBadgeClass = "bg-status-installing/15 text-status-installing";
              } else if (isTomorrow) {
                dateLabel = "明天";
                dateBadgeClass = "bg-copper-500/15 text-copper-600";
              }

              return (
                <Link
                  key={apt.id}
                  to={`/orders/${apt.orderId}`}
                  className="block p-4 rounded-xl bg-cream-50 border border-walnut-100 hover:border-copper-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${dateBadgeClass}`}>
                        <CalendarDays className="w-3.5 h-3.5" />
                        {dateLabel}
                      </span>
                      {isToday && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          今日待装
                        </span>
                      )}
                    </div>
                    <StatusBadge status={apt.order!.status} size="sm" />
                  </div>

                  <div className="font-medium text-walnut-800 mb-2 group-hover:text-copper-600 transition-colors">
                    {apt.customer!.name} · {apt.order!.orderNo}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-walnut-500">
                      <HardHat className="w-3.5 h-3.5 text-copper-500" />
                      <span>安装师傅：{apt.installer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-walnut-500">
                      <MapPin className="w-3.5 h-3.5 text-copper-500" />
                      <span className="truncate">{apt.customer!.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-walnut-500">
                      <Phone className="w-3.5 h-3.5 text-copper-500" />
                      <span>{apt.customer!.phone}</span>
                    </div>
                  </div>

                  {apt.remark && (
                    <div className="mt-3 pt-3 border-t border-walnut-100">
                      <div className="text-xs text-walnut-400 mb-1">上门备注</div>
                      <div className="text-sm text-walnut-600 line-clamp-2">{apt.remark}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
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
