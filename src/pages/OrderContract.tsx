import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
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
  GlassWater,
  Wrench,
  Calculator,
  FileText,
  Calendar,
  Shield,
  HandCoins,
  Hammer,
  PenLine,
  Check,
  X,
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

export default function OrderContract() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contractRef = useRef<HTMLDivElement>(null);

  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const windowItems = useStore((s) => s.windowItems);
  const contracts = useStore((s) => s.contracts);
  const setContract = useStore((s) => s.setContract);

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
  const contract = useMemo(
    () => contracts.find((c) => c.orderId === id),
    [contracts, id]
  );

  const [isEditing, setIsEditing] = useState(!contract);
  const [editForm, setEditForm] = useState({
    paymentTerms: contract?.paymentTerms || "签订合同支付30%定金，生产完毕支付40%进度款，安装验收合格后付清30%尾款",
    installationTerms: contract?.installationTerms || "预计15-20个工作日生产完成，上门安装预计2个工作日。安装前请客户清理安装现场，确保水电到位。",
    warrantyMonths: contract?.warrantyMonths || 24,
    customerSignature: contract?.customerSignature || "",
    signedAt: contract?.signedAt || "",
  });

  const handleSave = () => {
    if (!order) return;
    setContract(order.id, {
      paymentTerms: editForm.paymentTerms.trim(),
      installationTerms: editForm.installationTerms.trim(),
      warrantyMonths: editForm.warrantyMonths,
      customerSignature: editForm.customerSignature.trim() || undefined,
      signedAt: editForm.signedAt || undefined,
    });
    setIsEditing(false);
  };

  const handlePrint = () => {
    if (contractRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>合同确认单 - ${order?.orderNo}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #5D4037; padding-bottom: 20px; }
                .header h1 { color: #5D4037; font-size: 36px; margin-bottom: 10px; letter-spacing: 8px; }
                .header p { color: #666; font-size: 14px; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 18px; color: #5D4037; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600; }
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
                .summary-row.total { font-size: 22px; font-weight: bold; color: #5D4037; border-top: 2px solid #5D4037; margin-top: 10px; padding-top: 15px; }
                .terms-box { background: #fffdf5; padding: 20px; border-radius: 8px; border: 1px solid #e8dcc8; }
                .terms-box p { line-height: 1.8; margin-bottom: 10px; }
                .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                .signature-box { text-align: center; }
                .signature-line { border-bottom: 1px solid #333; padding-top: 60px; margin-bottom: 10px; }
                .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px dashed #ccc; padding-top: 20px; }
                @media print {
                  body { padding: 20px; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              ${contractRef.current.innerHTML}
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
    if (!order || !customer || !contract) return;

    const rows = [
      {
        项目: "合同确认单",
        内容: `订单号：${order.orderNo}`,
        金额: "",
      },
      {
        项目: "签订日期",
        内容: contract.signedAt ? formatDate(contract.signedAt) : "未签字",
        金额: "",
      },
      {
        项目: "",
        内容: "",
        金额: "",
      },
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
        项目: "合同总价",
        内容: "",
        金额: order.totalAmount,
      },
      {
        项目: "",
        内容: "",
        金额: "",
      },
      {
        项目: "付款约定",
        内容: contract.paymentTerms,
        金额: "",
      },
      {
        项目: "安装约定",
        内容: contract.installationTerms,
        金额: "",
      },
      {
        项目: "保修期限",
        内容: `${contract.warrantyMonths}个月`,
        金额: "",
      },
      {
        项目: "客户签字",
        内容: contract.customerSignature || "未签字",
        金额: "",
      },
    ];

    exportToCsv(rows, `合同确认单-${order.orderNo}.csv`);
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

  const displayContract = contract || editForm;

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
              合同确认单
            </h1>
            <p className="text-walnut-500 text-sm mt-1">
              订单号 {order.orderNo} · {STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {contract && !isEditing && (
            <>
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
                打印合同
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                编辑
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (contract) {
                    setEditForm({
                      paymentTerms: contract.paymentTerms,
                      installationTerms: contract.installationTerms,
                      warrantyMonths: contract.warrantyMonths,
                      customerSignature: contract.customerSignature || "",
                      signedAt: contract.signedAt || "",
                    });
                  }
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                保存
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="card p-6 no-print">
          <h3 className="section-title mb-4">
            <FileText className="w-5 h-5 text-copper-500" /> 编辑合同条款
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-walnut-700 mb-2">
                <HandCoins className="w-4 h-4 inline -mt-0.5 mr-1 text-copper-500" />
                付款约定
              </label>
              <textarea
                rows={3}
                value={editForm.paymentTerms}
                onChange={(e) =>
                  setEditForm({ ...editForm, paymentTerms: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                placeholder="请填写付款方式和时间节点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-walnut-700 mb-2">
                <Hammer className="w-4 h-4 inline -mt-0.5 mr-1 text-copper-500" />
                安装约定
              </label>
              <textarea
                rows={3}
                value={editForm.installationTerms}
                onChange={(e) =>
                  setEditForm({ ...editForm, installationTerms: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                placeholder="请填写生产周期、安装时间、注意事项等"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  <Shield className="w-4 h-4 inline -mt-0.5 mr-1 text-copper-500" />
                  保修期限（月）
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={editForm.warrantyMonths}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      warrantyMonths: parseInt(e.target.value) || 12,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  <Calendar className="w-4 h-4 inline -mt-0.5 mr-1 text-copper-500" />
                  签字日期
                </label>
                <input
                  type="date"
                  value={editForm.signedAt}
                  onChange={(e) =>
                    setEditForm({ ...editForm, signedAt: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-walnut-700 mb-2">
                <PenLine className="w-4 h-4 inline -mt-0.5 mr-1 text-copper-500" />
                客户签字
              </label>
              <input
                type="text"
                placeholder="请输入客户姓名"
                value={editForm.customerSignature}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerSignature: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
              />
            </div>
          </div>
        </div>
      )}

      <div ref={contractRef} className="space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-walnut-100 shadow-sm">
          <div className="text-center pb-6 border-b-3 border-double border-walnut-300 mb-6">
            <h2 className="font-serif text-4xl font-bold text-walnut-800 mb-3 tracking-widest">
              门 窗 工 程 确 认 单
            </h2>
            <p className="text-walnut-500">
              合同编号：{order.orderNo} · 签订日期：
              {displayContract.signedAt
                ? formatDate(displayContract.signedAt)
                : "__________"}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-walnut-800 mb-4 pb-2 border-b border-walnut-100 flex items-center gap-2">
                <User className="w-5 h-5 text-copper-600" />
                需方（客户）信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-walnut-500 min-w-[80px]">客户姓名</span>
                  <span className="font-medium text-walnut-800">
                    {customer.name}
                  </span>
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
                门窗产品明细
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-walnut-800 text-white">
                      <th className="px-4 py-3 text-left font-medium rounded-tl-lg">
                        序号
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        尺寸 (mm)
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        型材颜色
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        玻璃类型
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        五金品牌
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        数量
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        型材 (米)
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        玻璃 (㎡)
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        单价
                      </th>
                      <th className="px-4 py-3 text-right font-medium rounded-tr-lg">
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const profileMeters = calcItemProfileMeters(
                        item.widthMm,
                        item.heightMm
                      );
                      const glassArea = calcItemGlassArea(
                        item.widthMm,
                        item.heightMm
                      );
                      const subtotal = item.unitPrice * item.quantity;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-walnut-50 hover:bg-cream-50/50"
                        >
                          <td className="px-4 py-3 text-walnut-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-walnut-700">
                            {item.widthMm}×{item.heightMm}
                          </td>
                          <td className="px-4 py-3 text-walnut-700">
                            {item.profileColor}
                          </td>
                          <td className="px-4 py-3 text-walnut-700">
                            {GLASS_LABELS[item.glassType]}
                          </td>
                          <td className="px-4 py-3 text-walnut-700">
                            {item.hardwareBrand}
                          </td>
                          <td className="px-4 py-3 text-center text-walnut-700">
                            {item.quantity}
                          </td>
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
                合同总价
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
                <span className="text-xl font-semibold text-walnut-800">
                  合同总金额（人民币）
                </span>
                <span className="text-3xl font-bold text-copper-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            <div className="bg-cream-50/80 rounded-xl p-6 border border-walnut-100">
              <h3 className="text-lg font-semibold text-walnut-800 mb-4 pb-2 border-b border-walnut-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-copper-600" />
                约定条款
              </h3>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HandCoins className="w-4 h-4 text-copper-600" />
                    <span className="font-medium text-walnut-700">付款方式：</span>
                  </div>
                  <p className="text-walnut-600 leading-relaxed pl-6">
                    {displayContract.paymentTerms}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hammer className="w-4 h-4 text-copper-600" />
                    <span className="font-medium text-walnut-700">安装约定：</span>
                  </div>
                  <p className="text-walnut-600 leading-relaxed pl-6">
                    {displayContract.installationTerms}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-copper-600" />
                    <span className="font-medium text-walnut-700">
                      保修期限：
                    </span>
                  </div>
                  <p className="text-walnut-600 leading-relaxed pl-6">
                    产品整体保修 <span className="font-semibold text-copper-600">{displayContract.warrantyMonths}个月</span>
                    ，保修期内非人为损坏免费维修，人为损坏只收成本费。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 pt-6 border-t-2 border-dashed border-walnut-200">
              <div className="text-center">
                <div className="text-walnut-500 text-sm mb-2">供方（门店）签字</div>
                <div className="h-20 border-b-2 border-walnut-300 mb-2" />
                <div className="text-walnut-400 text-sm">门窗管家 · 专业门窗定制</div>
              </div>
              <div className="text-center">
                <div className="text-walnut-500 text-sm mb-2">需方（客户）签字</div>
                <div className="h-20 border-b-2 border-walnut-300 mb-2 flex items-end justify-center pb-2">
                  {displayContract.customerSignature && (
                    <span className="font-serif text-2xl text-walnut-800">
                      {displayContract.customerSignature}
                    </span>
                  )}
                </div>
                <div className="text-walnut-400 text-sm">
                  {displayContract.signedAt
                    ? `签字日期：${formatDate(displayContract.signedAt)}`
                    : "签字日期：__________"}
                </div>
              </div>
            </div>

            <div className="text-center text-walnut-400 text-sm pt-4 border-t border-walnut-100">
              <p>本确认单一式两份，双方各执一份，签字后生效</p>
              <p className="mt-1">如有争议，双方友好协商解决</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
