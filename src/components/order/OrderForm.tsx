import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator, User, Phone, MapPin, FileText } from "lucide-react";
import { useOrderForm } from "@/hooks/useOrderForm";
import type { Customer, Order, WindowItem } from "@/store/types";
import { PROFILE_COLORS, HARDWARE_BRANDS, GLASS_LABELS } from "@/store/types";
import { formatCurrency, formatNumber, calcItemProfileMeters, calcItemGlassArea } from "@/utils";

interface Props {
  customer?: Customer;
  order?: Order;
  orderItems?: WindowItem[];
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerId?: string;
    items: ReturnType<typeof useOrderForm>["items"];
    remark?: string;
  }) => void;
  onCancel?: () => void;
  submitText?: string;
}

export default function OrderForm({
  customer,
  order,
  orderItems,
  onSubmit,
  onCancel,
  submitText = "创建订单",
}: Props) {
  const { items, summary, addItem, removeItem, updateItem } = useOrderForm(orderItems);

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [remark, setRemark] = useState(order?.remark ?? "");

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address);
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || items.length === 0) return;
    onSubmit({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      customerId: customer?.id,
      items,
      remark: remark.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <h3 className="section-title mb-5">
          <User className="w-5 h-5 text-copper-500" />
          客户信息
        </h3>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="input-label">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 客户姓名 *
              </span>
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入客户姓名"
              required
            />
          </div>
          <div>
            <label className="input-label">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> 联系电话 *
              </span>
            </label>
            <input
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="input-label">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 安装地址
              </span>
            </label>
            <input
              type="text"
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="请输入详细安装地址"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <Calculator className="w-5 h-5 text-copper-500" />
            门窗明细
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="btn-secondary !py-2 !px-3 !text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> 添加一扇窗
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-cream-50 border border-walnut-100/50 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-walnut-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-copper-gradient text-white flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  第 {idx + 1} 扇窗
                </span>
                <div className="flex items-center gap-4 text-xs text-walnut-500">
                  <span>
                    型材: <b className="text-walnut-800">{formatNumber(calcItemProfileMeters(item.widthMm, item.heightMm) * item.quantity)}</b> 米
                  </span>
                  <span>
                    玻璃: <b className="text-walnut-800">{formatNumber(calcItemGlassArea(item.widthMm, item.heightMm) * item.quantity)}</b> ㎡
                  </span>
                  <span>
                    小计: <b className="text-copper-600">{formatCurrency(item.unitPrice * item.quantity)}</b>
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="ml-2 p-1.5 rounded-lg text-walnut-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                <div>
                  <label className="input-label !text-xs">宽度 (mm)</label>
                  <input
                    type="number"
                    className="input-field !py-2 text-sm"
                    value={item.widthMm}
                    onChange={(e) =>
                      updateItem(idx, "widthMm", Number(e.target.value))
                    }
                    min={100}
                    step={50}
                  />
                </div>
                <div>
                  <label className="input-label !text-xs">高度 (mm)</label>
                  <input
                    type="number"
                    className="input-field !py-2 text-sm"
                    value={item.heightMm}
                    onChange={(e) =>
                      updateItem(idx, "heightMm", Number(e.target.value))
                    }
                    min={100}
                    step={50}
                  />
                </div>
                <div>
                  <label className="input-label !text-xs">型材颜色</label>
                  <select
                    className="input-field !py-2 text-sm"
                    value={item.profileColor}
                    onChange={(e) =>
                      updateItem(idx, "profileColor", e.target.value)
                    }
                  >
                    {PROFILE_COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label !text-xs">玻璃类型</label>
                  <select
                    className="input-field !py-2 text-sm"
                    value={item.glassType}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "glassType",
                        e.target.value as "single" | "double"
                      )
                    }
                  >
                    {Object.entries(GLASS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label !text-xs">五金品牌</label>
                  <select
                    className="input-field !py-2 text-sm"
                    value={item.hardwareBrand}
                    onChange={(e) =>
                      updateItem(idx, "hardwareBrand", e.target.value)
                    }
                  >
                    {HARDWARE_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label !text-xs">单价 (元)</label>
                  <input
                    type="number"
                    className="input-field !py-2 text-sm"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, "unitPrice", Number(e.target.value))
                    }
                    min={0}
                    step={100}
                  />
                </div>
                <div>
                  <label className="input-label !text-xs">数量</label>
                  <input
                    type="number"
                    className="input-field !py-2 text-sm"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", Number(e.target.value))
                    }
                    min={1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <label className="input-label">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> 备注
          </span>
        </label>
        <textarea
          className="input-field min-h-[80px] resize-y"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="特殊要求、安装时间约定等..."
        />
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="glass-morphism rounded-xl2 p-5 shadow-card border border-copper-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-xs text-walnut-400 mb-1">型材总米数</div>
                <div className="text-xl font-serif font-bold text-walnut-800">
                  {formatNumber(summary.totalProfileMeters)}
                  <span className="text-sm font-normal text-walnut-500 ml-1">米</span>
                </div>
              </div>
              <div className="w-px h-10 bg-walnut-200" />
              <div className="text-center">
                <div className="text-xs text-walnut-400 mb-1">玻璃总面积</div>
                <div className="text-xl font-serif font-bold text-walnut-800">
                  {formatNumber(summary.totalGlassArea)}
                  <span className="text-sm font-normal text-walnut-500 ml-1">㎡</span>
                </div>
              </div>
              <div className="w-px h-10 bg-walnut-200" />
              <div className="text-center">
                <div className="text-xs text-walnut-400 mb-1">订单总金额</div>
                <div className="text-2xl font-serif font-bold text-gradient-copper">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-secondary"
                >
                  取消
                </button>
              )}
              <button type="submit" className="btn-primary">
                {submitText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
