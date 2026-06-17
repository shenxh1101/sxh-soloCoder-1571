import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useStore } from "@/store";
import OrderForm from "@/components/order/OrderForm";
import { useOrderForm } from "@/hooks/useOrderForm";
import type { WindowItem } from "@/store/types";

export default function OrderNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get("customerId");
  const createOrder = useStore((s) => s.createOrder);
  const customers = useStore((s) => s.customers);

  const prefilledCustomer = useMemo(
    () => (customerId ? customers.find((c) => c.id === customerId) : undefined),
    [customers, customerId]
  );

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl font-bold text-walnut-800">
              新建订单
            </h1>
            {prefilledCustomer && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-copper-gradient/15 text-copper-700 text-sm font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                老客户：{prefilledCustomer.name}
              </span>
            )}
          </div>
          <p className="text-walnut-500 text-sm mt-0.5">
            填写客户信息和门窗明细，系统将自动计算型材米数、玻璃面积和总金额
          </p>
        </div>
      </div>

      <OrderForm
        customer={prefilledCustomer}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/orders")}
        submitText="创建订单"
      />
    </div>
  );
}
