import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/store";
import OrderForm from "@/components/order/OrderForm";
import { useOrderForm } from "@/hooks/useOrderForm";
import type { WindowItem } from "@/store/types";

export default function OrderNew() {
  const navigate = useNavigate();
  const createOrder = useStore((s) => s.createOrder);

  type FormItems = ReturnType<typeof useOrderForm>["items"];

  const handleSubmit = (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerId?: string;
    items: FormItems;
    remark?: string;
  }) => {
    const newOrder = createOrder({
      ...data,
      items: data.items.map((i) => ({
        ...i,
      })),
    } as any);
    navigate(`/orders/${newOrder.id}`, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold text-walnut-800">
            新建订单
          </h1>
          <p className="text-walnut-500 text-sm mt-0.5">
            填写客户信息和门窗明细，系统将自动计算型材米数、玻璃面积和总金额
          </p>
        </div>
      </div>

      <OrderForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/orders")}
        submitText="创建订单"
      />
    </div>
  );
}
