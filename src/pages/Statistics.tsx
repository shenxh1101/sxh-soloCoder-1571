import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  Palette,
  Layers,
  Award,
  Calendar,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Wallet,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import {
  useStatistics,
  useMonthlyStats,
  useColorRank,
  useGlassStats,
} from "@/hooks/useStatistics";
import { useStore } from "@/store";
import { STATUS_LABELS, STATUS_FLOW, PROFILE_COLORS } from "@/store/types";
import StatusBadge from "@/components/order/StatusBadge";
import { formatCurrency, exportToCsv, formatDate } from "@/utils";

export default function Statistics() {
  const stats = useStatistics();
  const monthly = useMonthlyStats(6);
  const colorRank = useColorRank();
  const glass = useGlassStats();
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const windowItems = useStore((s) => s.windowItems);
  const payments = useStore((s) => s.payments);
  const [showPaymentListModal, setShowPaymentListModal] = useState<"paid" | "unpaid" | "overdue" | null>(null);

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );

  const getCustomerById = (id: string) => customers.find((c) => c.id === id);
  const getItemsByOrderId = (orderId: string) =>
    windowItems.filter((i) => i.orderId === orderId);
  const getTotalPaidByOrderId = (orderId: string) =>
    payments
      .filter((p) => p.orderId === orderId)
      .reduce((s, p) => s + p.amount, 0);

  const { thisMonth, lastMonth } = useMemo(() => {
    const tm = orders.filter(
      (o) => new Date(o.createdAt) >= thisMonthStart
    );
    const lm = orders.filter(
      (o) =>
        new Date(o.createdAt) >= lastMonthStart &&
        new Date(o.createdAt) < thisMonthStart
    );
    return { thisMonth: tm, lastMonth: lm };
  }, [orders, thisMonthStart, lastMonthStart]);

  const handleExport = () => {
    const rows = thisMonth
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((order) => {
        const customer = getCustomerById(order.customerId);
        const items = getItemsByOrderId(order.id);
        const totalPaid = getTotalPaidByOrderId(order.id);
        const totalUnpaid = order.totalAmount - totalPaid;

        const colors = [...new Set(items.map((i) => i.profileColor))];
        const colorStr = colors.join("、") || "-";

        let paymentStatus = "未收款";
        if (totalPaid <= 0) paymentStatus = "未收款";
        else if (totalUnpaid <= 0) paymentStatus = "已结清";
        else paymentStatus = "部分收款";

        return {
          订单号: order.orderNo,
          客户姓名: customer?.name || "-",
          联系电话: customer?.phone || "-",
          安装地址: customer?.address || "-",
          型材颜色: colorStr,
          订单金额: order.totalAmount,
          已收金额: totalPaid,
          未收金额: totalUnpaid,
          收款状态: paymentStatus,
          订单进度: STATUS_LABELS[order.status],
          下单日期: order.createdAt.split("T")[0],
        };
      });

    const monthStr = `${today.getFullYear()}年${today.getMonth() + 1}月`;
    exportToCsv(rows, `门窗订单报表-${monthStr}.csv`);
  };

  const thisMonthRevenue = thisMonth.reduce(
    (s, o) => s + o.totalAmount,
    0
  );
  const lastMonthRevenue = lastMonth.reduce(
    (s, o) => s + o.totalAmount,
    0
  );
  const revenueGrowth =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
      ? 100
      : 0;
  const orderGrowth =
    lastMonth.length > 0
      ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
      : thisMonth.length > 0
      ? 100
      : 0;
  const thisMonthAvg =
    thisMonth.length > 0
      ? Math.round(thisMonthRevenue / thisMonth.length)
      : 0;
  const lastMonthAvg =
    lastMonth.length > 0
      ? Math.round(lastMonthRevenue / lastMonth.length)
      : 0;
  const avgGrowth =
    lastMonthAvg > 0
      ? Math.round(((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100)
      : thisMonthAvg > 0
      ? 100
      : 0;

  const topCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.customerId, (map.get(o.customerId) ?? 0) + o.totalAmount);
    }
    return [...map.entries()]
      .map(([cid, amt]) => ({
        customer: getCustomerById(cid),
        amount: amt,
      }))
      .filter((x) => x.customer)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [orders, customers]);

  const paymentStats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let paidAmount = 0;
    let unpaidAmount = 0;
    let overdueAmount = 0;
    const paidOrders: any[] = [];
    const unpaidOrders: any[] = [];
    const overdueOrders: any[] = [];

    orders.forEach((order) => {
      const totalPaid = getTotalPaidByOrderId(order.id);
      const totalUnpaid = order.totalAmount - totalPaid;
      const customer = getCustomerById(order.customerId);

      if (totalUnpaid <= 0) {
        paidAmount += order.totalAmount;
        paidOrders.push({ ...order, customer, totalPaid, totalUnpaid });
      } else {
        unpaidAmount += totalUnpaid;
        if (order.paymentDueDate) {
          const dueDate = new Date(order.paymentDueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < now) {
            overdueAmount += totalUnpaid;
            overdueOrders.push({ ...order, customer, totalPaid, totalUnpaid });
          } else {
            unpaidOrders.push({ ...order, customer, totalPaid, totalUnpaid });
          }
        } else {
          unpaidOrders.push({ ...order, customer, totalPaid, totalUnpaid });
        }
      }
    });

    return {
      paid: {
        amount: paidAmount,
        count: paidOrders.length,
        orders: paidOrders.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
      },
      unpaid: {
        amount: unpaidAmount,
        count: unpaidOrders.length,
        orders: unpaidOrders.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
      },
      overdue: {
        amount: overdueAmount,
        count: overdueOrders.length,
        orders: overdueOrders.sort((a, b) => {
          const aDue = new Date(a.paymentDueDate!).getTime();
          const bDue = new Date(b.paymentDueDate!).getTime();
          return aDue - bDue;
        }),
      },
    };
  }, [orders, payments, customers]);

  const revenueTrendOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(93,64,55,0.95)",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params: any) => {
        const p = params[0];
        const q = params[1];
        return `${p.name}<br/>订单数: ${p.value}单<br/>营收: ¥${q.value.toLocaleString()}`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: "#5D4037", fontSize: 12 },
      icon: "roundRect",
    },
    grid: { left: 55, right: 55, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: monthly.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#D4BEA1" } },
      axisLabel: { color: "#5D4037", fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "订单(单)",
        nameTextStyle: { color: "#9A7149", fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: "#9A7149", fontSize: 11 },
        splitLine: { lineStyle: { color: "#F4EDE0", type: "dashed" } },
      },
      {
        type: "value",
        name: "营收(元)",
        nameTextStyle: { color: "#9A7149", fontSize: 11 },
        axisLine: { show: false },
        axisLabel: {
          color: "#9A7149",
          fontSize: 11,
          formatter: (v: number) => `${v / 10000}万`,
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "订单数",
        type: "bar",
        data: monthly.orderCounts,
        barWidth: 20,
        yAxisIndex: 0,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#C9A961" },
              { offset: 1, color: "#E6CE8B" },
            ],
          },
        },
      },
      {
        name: "营收",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        symbol: "circle",
        symbolSize: 8,
        data: monthly.revenues,
        lineStyle: { width: 3, color: "#5D4037" },
        itemStyle: { color: "#C9A961", borderColor: "#5D4037", borderWidth: 2 },
      },
    ],
  };

  const colorRankOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(93,64,55,0.95)",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params: any) => {
        const p = params[0];
        const d = colorRank[p.dataIndex];
        return `${p.name}<br/>销量: ${p.value}扇<br/>型材: ${d.meters.toFixed(2)}米`;
      },
    },
    grid: { left: 80, right: 40, top: 20, bottom: 20 },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#9A7149", fontSize: 11 },
      splitLine: { lineStyle: { color: "#F4EDE0", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: colorRank.map((c) => c.color).reverse(),
      axisLine: { lineStyle: { color: "#D4BEA1" } },
      axisLabel: { color: "#5D4037", fontSize: 12 },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: colorRank.map((c) => c.count).reverse(),
        barWidth: 18,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (p: any) => {
            const colors = [
              "#5D4037",
              "#7B5435",
              "#9A7149",
              "#C9A961",
              "#D9B85A",
              "#E6CE8B",
              "#B99870",
              "#8A6A2F",
            ];
            return colors[p.dataIndex % colors.length];
          },
        },
        label: {
          show: true,
          position: "right",
          color: "#5D4037",
          fontSize: 12,
          formatter: "{c} 扇",
        },
      },
    ],
  };

  const glassOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c}扇 ({d}%)" },
    legend: {
      bottom: 0,
      textStyle: { color: "#5D4037", fontSize: 12 },
      icon: "circle",
      itemWidth: 10,
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "72%"],
        center: ["50%", "42%"],
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          show: true,
          position: "center",
          formatter: () => {
            const total = glass.single + glass.double;
            return `{total|${total}}\n{label|总扇数}`;
          },
          rich: {
            total: {
              fontSize: 32,
              fontWeight: 700,
              color: "#5D4037",
              fontFamily: "Noto Serif SC",
              lineHeight: 40,
            },
            label: {
              fontSize: 12,
              color: "#9A7149",
              lineHeight: 18,
            },
          },
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(93,64,55,0.3)" },
        },
        data: [
          {
            value: glass.single,
            name: "单层玻璃",
            itemStyle: { color: "#B99870" },
          },
          {
            value: glass.double,
            name: "双层中空玻璃",
            itemStyle: { color: "#C9A961" },
          },
        ],
      },
    ],
  };

  const statusCompareOption = {
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
      data: STATUS_FLOW.map((s) => STATUS_LABELS[s]),
      axisLine: { lineStyle: { color: "#D4BEA1" } },
      axisLabel: { color: "#5D4037", fontSize: 11 },
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
        type: "bar",
        data: STATUS_FLOW.map((s, idx) => ({
          value: stats.statusCounts[s],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: [
              "#6B7280",
              "#3B82F6",
              "#8B5CF6",
              "#F59E0B",
              "#10B981",
            ][idx],
          },
        })),
        barWidth: 32,
        label: {
          show: true,
          position: "top",
          color: "#5D4037",
          fontWeight: 600,
          fontSize: 13,
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800 mb-1">
            统计报表
          </h1>
          <p className="text-walnut-500">
            <Calendar className="w-4 h-4 inline -mt-0.5 mr-1" />
            {thisMonthStart.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
            })}
            数据概览
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          导出本月报表
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <MetricCard
          icon={ClipboardList}
          label="本月订单数"
          value={`${thisMonth.length} 单`}
          growth={orderGrowth}
          subtext={`上月 ${lastMonth.length} 单`}
        />
        <MetricCard
          icon={DollarSign}
          label="本月营收"
          value={formatCurrency(thisMonthRevenue)}
          growth={revenueGrowth}
          subtext={`上月 ${formatCurrency(lastMonthRevenue)}`}
          highlight
        />
        <MetricCard
          icon={TrendingUp}
          label="平均客单价"
          value={formatCurrency(thisMonthAvg)}
          growth={avgGrowth}
          subtext={`上月 ${formatCurrency(lastMonthAvg)}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card p-6 col-span-2">
          <h3 className="section-title mb-4">订单与营收趋势（近6个月）</h3>
          <ReactECharts
            option={revenueTrendOption}
            style={{ height: 320 }}
          />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">
            <Layers className="w-5 h-5 text-copper-500" /> 玻璃类型分布
          </h3>
          <ReactECharts option={glassOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card p-6 col-span-2">
          <h3 className="section-title mb-4">
            <Palette className="w-5 h-5 text-copper-500" /> 型材颜色销量排行
          </h3>
          <ReactECharts option={colorRankOption} style={{ height: 280 }} />
        </div>
        <div className="card p-6">
          <h3 className="section-title mb-4">
            <Award className="w-5 h-5 text-copper-500" /> VIP客户榜
          </h3>
          {topCustomer.length === 0 ? (
            <div className="py-8 text-center text-walnut-400 text-sm">
              暂无数据
            </div>
          ) : (
            <div className="space-y-3">
              {topCustomer.map((row, idx) => (
                <div
                  key={row.customer!.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0
                        ? "bg-copper-gradient text-white"
                        : idx === 1
                        ? "bg-walnut-400 text-white"
                        : idx === 2
                        ? "bg-walnut-600 text-white"
                        : "bg-walnut-200 text-walnut-700"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-walnut-800 truncate">
                      {row.customer!.name}
                    </div>
                    <div className="text-xs text-walnut-400 truncate">
                      {row.customer!.phone}
                    </div>
                  </div>
                  <div className="font-serif font-bold text-copper-600 text-sm">
                    {formatCurrency(row.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-completed via-copper-500 to-red-500" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="section-title">
            <Wallet className="w-5 h-5 text-copper-500" /> 收款看板
          </h3>
          <div className="text-sm text-walnut-500">
            统计时间：{formatDate(today.toISOString())}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => setShowPaymentListModal("paid")}
            className="p-6 rounded-xl bg-gradient-to-br from-status-completed/5 to-status-completed/10 border border-status-completed/20 cursor-pointer hover:shadow-md hover:border-status-completed/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-status-completed/15 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-status-completed" />
              </div>
              <span className="text-xs font-medium text-status-completed bg-status-completed/10 px-2.5 py-1 rounded-full">
                {paymentStats.paid.count} 单
              </span>
            </div>
            <div className="text-3xl font-serif font-bold text-status-completed mb-1">
              {formatCurrency(paymentStats.paid.amount)}
            </div>
            <div className="text-sm text-walnut-500 flex items-center gap-1">
              本月已收款
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          <div
            onClick={() => setShowPaymentListModal("unpaid")}
            className="p-6 rounded-xl bg-gradient-to-br from-copper-500/5 to-copper-500/10 border border-copper-500/20 cursor-pointer hover:shadow-md hover:border-copper-500/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-copper-500/15 flex items-center justify-center">
                <Clock className="w-6 h-6 text-copper-600" />
              </div>
              <span className="text-xs font-medium text-copper-600 bg-copper-500/10 px-2.5 py-1 rounded-full">
                {paymentStats.unpaid.count} 单
              </span>
            </div>
            <div className="text-3xl font-serif font-bold text-copper-600 mb-1">
              {formatCurrency(paymentStats.unpaid.amount)}
            </div>
            <div className="text-sm text-walnut-500 flex items-center gap-1">
              待收款（未逾期）
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          <div
            onClick={() => setShowPaymentListModal("overdue")}
            className={`p-6 rounded-xl bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20 cursor-pointer hover:shadow-md hover:border-red-500/40 transition-all group ${
              paymentStats.overdue.count > 0 ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">
                {paymentStats.overdue.count} 单
              </span>
            </div>
            <div className="text-3xl font-serif font-bold text-red-500 mb-1">
              {formatCurrency(paymentStats.overdue.amount)}
            </div>
            <div className="text-sm text-walnut-500 flex items-center gap-1">
              逾期未收款
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">各状态订单数量对比</h3>
        <ReactECharts option={statusCompareOption} style={{ height: 260 }} />
      </div>

      {showPaymentListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 mx-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-walnut-800">
                  {showPaymentListModal === "paid" && "本月已收款订单"}
                  {showPaymentListModal === "unpaid" && "待收款订单（未逾期）"}
                  {showPaymentListModal === "overdue" && "逾期未收款订单"}
                </h3>
                <p className="text-sm text-walnut-500 mt-1">
                  共{" "}
                  {showPaymentListModal === "paid" && paymentStats.paid.count}
                  {showPaymentListModal === "unpaid" && paymentStats.unpaid.count}
                  {showPaymentListModal === "overdue" && paymentStats.overdue.count}{" "}
                  单，合计{" "}
                  {showPaymentListModal === "paid" &&
                    formatCurrency(paymentStats.paid.amount)}
                  {showPaymentListModal === "unpaid" &&
                    formatCurrency(paymentStats.unpaid.amount)}
                  {showPaymentListModal === "overdue" &&
                    formatCurrency(paymentStats.overdue.amount)}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentListModal(null)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {(() => {
                const orderList =
                  showPaymentListModal === "paid"
                    ? paymentStats.paid.orders
                    : showPaymentListModal === "unpaid"
                    ? paymentStats.unpaid.orders
                    : paymentStats.overdue.orders;

                if (orderList.length === 0) {
                  return (
                    <div className="py-12 text-center">
                      <div className="text-walnut-300 text-4xl mb-3">✅</div>
                      <p className="text-walnut-500">暂无相关订单</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {orderList.map((order: any) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        onClick={() => setShowPaymentListModal(null)}
                        className="block p-4 rounded-xl bg-cream-50 border border-walnut-100 hover:border-copper-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-walnut-500">
                              {order.orderNo}
                            </span>
                            <StatusBadge status={order.status} size="sm" />
                            {showPaymentListModal === "overdue" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                逾期 {Math.ceil(
                                  (today.getTime() -
                                    new Date(order.paymentDueDate!).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                天
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-walnut-500">订单金额</div>
                            <div className="font-semibold text-copper-600">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-walnut-500">
                            <User className="w-3.5 h-3.5 text-copper-500" />
                            <span className="truncate">{order.customer?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-walnut-500">
                            <Phone className="w-3.5 h-3.5 text-copper-500" />
                            <span>{order.customer?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-walnut-500">
                            <MapPin className="w-3.5 h-3.5 text-copper-500" />
                            <span className="truncate max-w-[180px]">
                              {order.customer?.address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-walnut-500">
                            <Calendar className="w-3.5 h-3.5 text-copper-500" />
                            <span>
                              {showPaymentListModal === "overdue"
                                ? `到期日：${formatDate(order.paymentDueDate!)}`
                                : `下单：${formatDate(order.createdAt)}`}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-walnut-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-walnut-500">已收：</span>
                              <span className="font-semibold text-status-completed">
                                {formatCurrency(order.totalPaid)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-walnut-500">未收：</span>
                              <span
                                className={`font-semibold ${
                                  order.totalUnpaid > 0
                                    ? showPaymentListModal === "overdue"
                                      ? "text-red-500"
                                      : "text-copper-600"
                                    : "text-status-completed"
                                }`}
                              >
                                {formatCurrency(order.totalUnpaid)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-copper-600 hover:text-copper-700 font-medium">
                            查看订单详情 →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  growth,
  subtext,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  growth: number;
  subtext: string;
  highlight?: boolean;
}) {
  const isPositive = growth >= 0;
  return (
    <div
      className={`${
        highlight
          ? "bg-walnut-gradient shadow-copper"
          : "bg-white shadow-card border border-walnut-100/60"
      } rounded-xl2 p-6 relative overflow-hidden`}
    >
      {highlight && (
        <>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
        </>
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              highlight
                ? "bg-white/15"
                : "bg-copper-gradient/15"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                highlight ? "text-copper-200" : "text-copper-600"
              }`}
            />
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              isPositive
                ? highlight
                  ? "bg-white/15 text-copper-200"
                  : "bg-green-50 text-status-completed"
                : "bg-red-50 text-red-500"
            }`}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(growth)}%
          </div>
        </div>
        <div
          className={`text-3xl font-serif font-bold mb-1 ${
            highlight ? "text-white" : "text-walnut-800"
          }`}
        >
          {value}
        </div>
        <div
          className={`text-sm ${
            highlight ? "text-copper-200/90" : "text-walnut-400"
          }`}
        >
          {label} · {subtext}
        </div>
      </div>
    </div>
  );
}
