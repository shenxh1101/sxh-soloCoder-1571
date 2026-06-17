import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useRef } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  FileSpreadsheet,
  Phone,
  MapPin,
  User,
  Ruler,
  Layers,
  Palette,
  GlassWater,
  Wrench,
  Calculator,
} from "lucide-react";
import { useStore } from "@/store";
import {
  GLASS_LABELS,
  STATUS_LABELS,
} from "@/store/types";
import {
  formatCurrency,
  formatDate,
  calcItemProfileMeters,
  calcItemGlassArea,
  exportToCsv,
} from "@/utils";

export default function OrderQuote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quoteRef = useRef<HTMLDivElement>(null);

  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const windowItems = useStore((s) => s.windowItems);
  const payments = useStore((s) => s.payments);

  const order = useMemo(
    () => orders.find((o) => o.id === id),
    [orders, id]
  );
  const customer = useMemo(
    () => customers.find((c) => c.id === order?.customerId),
    [customers, order?.customerId]
  );
  const items = useMemo(
    () => windowItems.filter((i) => i.orderId === id),
    [windowItems, id]
  );
  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.orderId === id)
        .reduce((s, p) => s + p.amount, 0),
    [payments, id]
  );
  const totalUnpaid = useMemo(
    () => (order ? order.totalAmount - totalPaid : 0),
    [order, totalPaid]
  );

  const handlePrint = () => {
    if (quoteRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>报价单 - ${order?.orderNo}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #5D4037; padding-bottom: 20px; }
                .header h1 { color: #5D4037; font-size: 32px; margin-bottom: 10px; }
                .header p { color: #666; font-size: 14px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 18px; color: #5D4037; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .info-item { display: flex; align-items: center; gap: 8px; }
                .info-label { color: #888; font-size: 14px; min-width: 70px; }
                .info-value { color: #333; font-size: 14px; font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { padding: 12px; text-align: left; border: 1px solid #e0e0e0; font-size: 14px; }
                th { background: #5D4037; color: white; font-weight: 500; }
                tr:nth-child(even) { background: #f9f9f9; }
                .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
                .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
                .summary-row.total { font-size: 20px; font-weight: bold; color: #5D4037; border-top: 2px solid #5D4037; margin-top: 10px; padding-top: 15px; }
                .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
                .payment-status { margin-top: 20px; padding: 15px; background: #fff8e1; border-radius: 8px; }
                @media print {
                  body { padding: 20px; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              ${quoteRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const handleExport = () => {
    if (!order || !customer) return;

    const rows = [
      {
        项目: "客户信息",
        内容: "",
        金额: "",
      },
      {
        项目: "客户姓名",
        内容: customer.name,
        金额: "",
      },
      {
        项目: "联系电话",
        内容: customer.phone,
        金额: "",
      },
      {
        项目: "安装地址",
        内容: customer.address,
        金额: "",
      },
      {
        项目: "",
        内容: "",
        金额: "",
      },
      {
        项目: "门窗明细",
        内容: "",
        金额: "",
      },
      ...items.map((item, idx) => ({
        项目: `第${idx + 1}扇窗`,
        内容: `${item.widthMm}×${item.heightMm}mm · ${item.profileColor} · ${GLASS_LABELS[item.glassType]} · ${item.hardwareBrand} · 型材${calcItemProfileMeters(item.widthMm, item.heightMm).toFixed(2)}米 · 玻璃${calcItemGlassArea(item.widthMm, item.heightMm).toFixed(2)}㎡ × ${item.quantity}扇`,
        金额: item.unitPrice * item.quantity,
      })),
      {
        项目: "",
        内容: "",
        金额: "",
      },
      {
        项目: "费用汇总",
        内容: "",
        金额: "",
      },
      {
        项目: "订单总金额",
        内容: "",
        金额: order.totalAmount,
      },
      {
        项目: "型材总用量",
        内容: `${order.totalProfileMeters.toFixed(2)} 米`,
        金额: "",
      },
      {
        项目: "玻璃总面积",
        内容: `${order.totalGlassArea.toFixed(2)} ㎡`,
        金额: "",
      },
      {
        项目: "已收金额",
        内容: "",
        金额: totalPaid,
      },
      {
        项目: "待收金额",
        内容: "",
        金额: totalUnpaid,
      },
    ];

    exportToCsv(rows, `报价单-${order.orderNo}.csv`);
  };

  if (!order || !customer) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-walnut-500">订单不存在</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 btn-secondary"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-walnut-800">
              报价单
            </h1>
            <p className="text-walnut-500 text-sm mt-1">
              订单号 {order.orderNo} · {STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            导出表格
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            打印报价单
          </button>
        </div>
      </div>

      <div ref={quoteRef} className="space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-walnut-100 shadow-sm">
          <div className="text-center pb-6 border-b-2 border-walnut-200 mb-6">
            <h2 className="font-serif text-4xl font-bold text-walnut-800 mb-3">
              门 窗 报 价 单
            </h2>
            <p className="text-walnut-500">
              报价日期：{formatDate(order.createdAt)} · 报价单号：{order.orderNo}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-walnut-800 mb-4 pb-2 border-b border-walnut-100 flex items-center gap-2">
                <User className="w-5 h-5 text-copper-600" />
                客户信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-walnut-500 min-w-[80px]">客户姓名</span>
                  <span className="font-medium text-walnut-800">{customer.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-walnut-400" />
                  <span className="text-walnut-800">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-3 col-span-2">
                  <MapPin className="w-4 h-4 text-walnut-400 mt-0.5" />
                  <span className="text-walnut-800">{customer.address}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-walnut-800 mb-4 pb-2 border-b border-walnut-100 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-copper-600" />
                门窗明细配置
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-walnut-800 text-white">
                      <th className="px-4 py-3 text-left font-medium rounded-tl-lg">序号</th>
                      <th className="px-4 py-3 text-left font-medium">尺寸 (mm)</th>
                      <th className="px-4 py-3 text-left font-medium">型材颜色</th>
                      <th className="px-4 py-3 text-left font-medium">玻璃类型</th>
                      <th className="px-4 py-3 text-left font-medium">五金品牌</th>
                      <th className="px-4 py-3 text-center font-medium">数量</th>
                      <th className="px-4 py-3 text-right font-medium">型材 (米)</th>
                      <th className="px-4 py-3 text-right font-medium">玻璃 (㎡)</th>
                      <th className="px-4 py-3 text-right font-medium">单价</th>
                      <th className="px-4 py-3 text-right font-medium rounded-tr-lg">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const profileMeters = calcItemProfileMeters(item.widthMm, item.heightMm);
                      const glassArea = calcItemGlassArea(item.widthMm, item.heightMm);
                      const subtotal = item.unitPrice * item.quantity;
                      return (
                        <tr key={item.id} className="border-b border-walnut-50 hover:bg-cream-50/50">
                          <td className="px-4 py-3 text-walnut-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-walnut-700">
                            {item.widthMm}×{item.heightMm}
                          </td>
                          <td className="px-4 py-3 text-walnut-700">{item.profileColor}</td>
                          <td className="px-4 py-3 text-walnut-700">{GLASS_LABELS[item.glassType]}</td>
                          <td className="px-4 py-3 text-walnut-700">{item.hardwareBrand}</td>
                          <td className="px-4 py-3 text-center text-walnut-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-walnut-700">
                            {(profileMeters * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-walnut-700">
                            {(glassArea * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-walnut-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-copper-600">
                            {formatCurrency(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-cream-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-walnut-800 mb-4 pb-2 border-b border-walnut-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-copper-600" />
                费用汇总
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-walnut-400" />
                  <span className="text-walnut-600">型材总用量：</span>
                  <span className="font-mono font-semibold text-walnut-800">
                    {order.totalProfileMeters.toFixed(2)} 米
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GlassWater className="w-4 h-4 text-walnut-400" />
                  <span className="text-walnut-600">玻璃总面积：</span>
                  <span className="font-mono font-semibold text-walnut-800">
                    {order.totalGlassArea.toFixed(2)} ㎡
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t-2 border-walnut-200 flex justify-between items-center">
                <span className="text-xl font-semibold text-walnut-800">订单总金额</span>
                <span className="text-3xl font-bold text-copper-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              {totalPaid > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-walnut-600">已收金额</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-walnut-600">待收金额</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(totalUnpaid)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-walnut-400 text-sm pt-4 border-t border-walnut-100">
              <p>本报价单有效期为30天 · 如有疑问请联系我们</p>
              <p className="mt-1">感谢您的信任，我们将竭诚为您服务！</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
