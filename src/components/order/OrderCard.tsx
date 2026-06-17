import { Link } from "react-router-dom";
import { MapPin, Phone, Calendar, Ruler, Square, Eye, Trash2 } from "lucide-react";
import type { Order, Customer } from "@/store/types";
import StatusBadge from "./StatusBadge";
import ProgressButton from "./ProgressButton";
import StatusProgress from "./StatusProgress";
import { formatCurrency, formatDate, formatNumber } from "@/utils";

interface Props {
  order: Order;
  customer?: Customer;
  onAdvance: () => void;
  onDelete: () => void;
}

export default function OrderCard({ order, customer, onAdvance, onDelete }: Props) {
  return (
    <div className="card p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-serif text-lg font-semibold text-walnut-800">
                {customer?.name ?? "未知客户"}
              </span>
              <StatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-walnut-400 font-mono">
              订单号 {order.orderNo}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-serif font-bold text-gradient-copper">
            {formatCurrency(order.totalAmount)}
          </div>
          <p className="text-xs text-walnut-400 mt-0.5">
            {customer?.phone ?? ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-copper-500 mt-0.5 shrink-0" />
          <span className="text-walnut-600 line-clamp-2">
            {customer?.address ?? "未填写地址"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="w-4 h-4 text-copper-500 shrink-0" />
          <span className="text-walnut-600">
            型材 <span className="font-medium text-walnut-800">{formatNumber(order.totalProfileMeters)}</span> 米
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Square className="w-4 h-4 text-copper-500 shrink-0" />
          <span className="text-walnut-600">
            玻璃 <span className="font-medium text-walnut-800">{formatNumber(order.totalGlassArea)}</span> ㎡
          </span>
        </div>
      </div>

      <div className="mb-5">
        <StatusProgress currentStatus={order.status} showLabels={false} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-walnut-100">
        <div className="flex items-center gap-2 text-xs text-walnut-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>下单 {formatDate(order.createdAt)}</span>
          {order.completedAt && (
            <span className="ml-3">完工 {formatDate(order.completedAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ProgressButton
            currentStatus={order.status}
            onAdvance={onAdvance}
          />
          <Link
            to={`/orders/${order.id}`}
            className="btn-secondary !py-1.5 !px-3 !text-sm flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            详情
          </Link>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-walnut-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="删除订单"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
