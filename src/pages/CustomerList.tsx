import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, User, Phone, MapPin, ShoppingBag, ChevronRight, RefreshCw } from "lucide-react";
import { useStore } from "@/store";
import { formatCurrency } from "@/utils";

export default function CustomerList() {
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const [search, setSearch] = useState("");

  const enriched = useMemo(() => {
    return customers
      .map((c) => {
        const custOrders = orders.filter((o) => o.customerId === c.id);
        const totalSpent = custOrders.reduce(
          (sum, o) => sum + o.totalAmount,
          0
        );
        const completedCount = custOrders.filter(
          (o) => o.status === "completed"
        ).length;
        return {
          ...c,
          orderCount: custOrders.length,
          totalSpent,
          completedCount,
        };
      })
      .filter((c) => {
        if (!search.trim()) return true;
        const kw = search.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(kw) ||
          c.phone.includes(kw) ||
          c.address.toLowerCase().includes(kw)
        );
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, orders, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800 mb-1">
            客户管理
          </h1>
          <p className="text-walnut-500">
            共 {customers.length} 位客户，累计订单 {orders.length} 单
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-walnut-400" />
            <input
              type="text"
              className="input-field !pl-10"
              placeholder="搜索客户姓名、电话、地址..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="btn-secondary !py-2 !px-3 flex items-center gap-1.5 !text-sm"
            >
              <RefreshCw className="w-4 h-4" /> 重置
            </button>
          )}
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-walnut-300 text-6xl mb-4">👥</div>
          <p className="text-walnut-500">暂无匹配的客户</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enriched.map((c) => (
            <Link
              key={c.id}
              to={`/customers/${c.id}`}
              className="card p-6 block group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-walnut-gradient flex items-center justify-center shrink-0 shadow-copper">
                  <span className="text-copper-200 text-xl font-serif font-bold">
                    {c.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif text-lg font-semibold text-walnut-800">
                      {c.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-walnut-300 group-hover:text-copper-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-walnut-500 mb-3">
                    <Phone className="w-3.5 h-3.5" />
                    {c.phone}
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-walnut-400 mb-4 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {c.address || "未填写地址"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-walnut-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-copper-500" />
                    <span className="text-xs text-walnut-400">订单</span>
                  </div>
                  <div className="font-semibold text-walnut-800">
                    {c.orderCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <User className="w-3.5 h-3.5 text-copper-500" />
                    <span className="text-xs text-walnut-400">已完工</span>
                  </div>
                  <div className="font-semibold text-walnut-800">
                    {c.completedCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-walnut-400 mb-1">累计消费</div>
                  <div className="font-serif font-bold text-gradient-copper">
                    {formatCurrency(c.totalSpent)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
