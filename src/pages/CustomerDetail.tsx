import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  Plus,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store";
import StatusBadge from "@/components/order/StatusBadge";
import StatusProgress from "@/components/order/StatusProgress";
import { formatCurrency, formatDate, copyToClipboard } from "@/utils";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customer = useStore((s) => s.getCustomerById(id!));
  const orders = useStore((s) => s.getOrdersByCustomerId(id!));
  const [copied, setCopied] = useState(false);

  if (!customer) {
    return (
      <div className="card p-16 text-center">
        <p className="text-walnut-500 mb-4">客户不存在</p>
        <Link to="/customers" className="btn-primary inline-block">
          返回客户列表
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter((o) => o.status === "completed");
  const avgOrder = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;

  const handleCopyPhone = async () => {
    const ok = await copyToClipboard(customer.phone);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800">
            客户详情
          </h1>
          <p className="text-walnut-500 text-sm mt-0.5">
            建档于 {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      <div className="card p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-copper-gradient opacity-[0.07] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-walnut-gradient flex items-center justify-center shadow-copper shrink-0">
            <span className="text-copper-200 text-3xl font-serif font-bold">
              {customer.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-walnut-800 mb-3">
              {customer.name}
            </h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400 mb-0.5">联系电话</div>
                  <button
                    onClick={handleCopyPhone}
                    className="flex items-center gap-2 font-medium text-walnut-800 hover:text-copper-600 transition-colors"
                  >
                    <span className="font-mono">{customer.phone}</span>
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-status-completed" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-walnut-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400 mb-0.5">安装地址</div>
                  <div className="font-medium text-walnut-800 leading-relaxed">
                    {customer.address || "未填写"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-walnut-100">
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <ShoppingBag className="w-4 h-4 text-copper-500" />
              <span className="text-xs text-walnut-400">历史订单</span>
            </div>
            <div className="text-2xl font-serif font-bold text-walnut-800">
              {orders.length}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Check className="w-4 h-4 text-copper-500" />
              <span className="text-xs text-walnut-400">已完工</span>
            </div>
            <div className="text-2xl font-serif font-bold text-status-completed">
              {completedOrders.length}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <CreditCard className="w-4 h-4 text-copper-500" />
              <span className="text-xs text-walnut-400">累计消费</span>
            </div>
            <div className="text-2xl font-serif font-bold text-gradient-copper">
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Calendar className="w-4 h-4 text-copper-500" />
              <span className="text-xs text-walnut-400">平均客单</span>
            </div>
            <div className="text-2xl font-serif font-bold text-walnut-800">
              {formatCurrency(avgOrder)}
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex justify-end">
          <Link
            to="/orders/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 为该客户新建订单
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">历史订单记录</h3>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-walnut-300 text-4xl mb-3">📦</div>
            <p className="text-walnut-500">该客户暂无订单记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block p-5 rounded-xl border border-walnut-100 hover:border-copper-300 hover:shadow-card transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-walnut-500">
                          {order.orderNo}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-xs text-walnut-400">
                        下单于 {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-serif font-bold text-gradient-copper">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                  <StatusProgress
                    currentStatus={order.status}
                    showLabels={false}
                  />
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-walnut-500">
                      <span className="text-walnut-400">型材</span>
                      <span className="font-medium text-walnut-700">
                        {order.totalProfileMeters.toFixed(2)} 米
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-walnut-500">
                      <span className="text-walnut-400">玻璃</span>
                      <span className="font-medium text-walnut-700">
                        {order.totalGlassArea.toFixed(2)} ㎡
                      </span>
                    </div>
                    {order.remark && (
                      <div className="flex items-center gap-2 text-walnut-500 col-span-1 truncate">
                        <span className="text-walnut-400">备注</span>
                        <span className="font-medium text-walnut-600 truncate">
                          {order.remark}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
