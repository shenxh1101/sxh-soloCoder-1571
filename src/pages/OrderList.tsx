import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Calendar, RefreshCw } from "lucide-react";
import { useStore } from "@/store";
import { STATUS_LABELS, STATUS_FLOW, type OrderStatus } from "@/store/types";
import OrderCard from "@/components/order/OrderCard";

export default function OrderList() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const advanceOrderStatus = useStore((s) => s.advanceOrderStatus);
  const deleteOrder = useStore((s) => s.deleteOrder);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const getCustomerById = (id: string) => customers.find((c) => c.id === id);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        const customer = getCustomerById(o.customerId);
        if (search.trim()) {
          const kw = search.trim().toLowerCase();
          const matchName = customer?.name.toLowerCase().includes(kw);
          const matchPhone = customer?.phone.includes(kw);
          const matchNo = o.orderNo.toLowerCase().includes(kw);
          const matchAddr = customer?.address.toLowerCase().includes(kw);
          if (!matchName && !matchPhone && !matchNo && !matchAddr) return false;
        }
        const createdAt = new Date(o.createdAt);
        if (dateFrom && createdAt < new Date(dateFrom)) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59);
          if (createdAt > end) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [orders, search, statusFilter, dateFrom, dateTo, customers]);

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个订单吗？此操作不可撤销。")) {
      deleteOrder(id);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const countByStatus = (s: OrderStatus | "all") =>
    s === "all"
      ? orders.length
      : orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800 mb-1">
            订单管理
          </h1>
          <p className="text-walnut-500">
            共 {orders.length} 条订单，当前筛选 {filteredOrders.length} 条
          </p>
        </div>
        <Link to="/orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新建订单
        </Link>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-walnut-400" />
            <input
              type="text"
              className="input-field !pl-10"
              placeholder="搜索客户姓名、电话、订单号、地址..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-walnut-400" />
            <input
              type="date"
              className="input-field !py-2 !w-40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-walnut-400">至</span>
            <input
              type="date"
              className="input-field !py-2 !w-40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <button
            onClick={resetFilters}
            className="btn-secondary !py-2 !px-3 flex items-center gap-1.5 !text-sm"
            title="重置筛选"
          >
            <RefreshCw className="w-4 h-4" /> 重置
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-walnut-400 mr-1" />
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === "all"
                ? "bg-walnut-gradient text-white shadow-sm"
                : "bg-cream-100 text-walnut-600 hover:bg-walnut-50"
            }`}
          >
            全部 ({countByStatus("all")})
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === s
                  ? "bg-walnut-gradient text-white shadow-sm"
                  : "bg-cream-100 text-walnut-600 hover:bg-walnut-50"
              }`}
            >
              {STATUS_LABELS[s]} ({countByStatus(s)})
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-walnut-300 text-6xl mb-4">📋</div>
          <p className="text-walnut-500 mb-4">暂无匹配的订单</p>
          <Link to="/orders/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 创建第一条订单
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              customer={getCustomerById(order.customerId)}
              onAdvance={() => advanceOrderStatus(order.id)}
              onDelete={() => handleDelete(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
