import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  Palette,
  Layers,
  Award,
  Calendar,
} from "lucide-react";
import {
  useStatistics,
  useMonthlyStats,
  useColorRank,
  useGlassStats,
} from "@/hooks/useStatistics";
import { useStore } from "@/store";
import { STATUS_LABELS, STATUS_FLOW } from "@/store/types";
import { formatCurrency } from "@/utils";

export default function Statistics() {
  const stats = useStatistics();
  const monthly = useMonthlyStats(6);
  const colorRank = useColorRank();
  const glass = useGlassStats();
  const orders = useStore((s) => s.orders);

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );

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
    const getCustomerById = useStore.getState().getCustomerById;
    return [...map.entries()]
      .map(([cid, amt]) => ({
        customer: getCustomerById(cid),
        amount: amt,
      }))
      .filter((x) => x.customer)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [orders]);

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

      <div className="card p-6">
        <h3 className="section-title mb-4">各状态订单数量对比</h3>
        <ReactECharts option={statusCompareOption} style={{ height: 260 }} />
      </div>
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
