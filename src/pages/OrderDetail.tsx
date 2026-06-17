import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Camera,
  Trash2,
  Ruler,
  Square,
  MapPin,
  Phone,
  User,
  FileText,
  Calendar,
  Download,
} from "lucide-react";
import { useStore } from "@/store";
import { STATUS_FLOW, GLASS_LABELS, type OrderStatus } from "@/store/types";
import StatusBadge from "@/components/order/StatusBadge";
import StatusProgress from "@/components/order/StatusProgress";
import ProgressButton from "@/components/order/ProgressButton";
import OrderForm from "@/components/order/OrderForm";
import { useOrderForm } from "@/hooks/useOrderForm";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatDateTime,
  calcItemProfileMeters,
  calcItemGlassArea,
} from "@/utils";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const order = useStore((s) => s.getOrderById(id!));
  const customer = useStore((s) => s.getCustomerById(order?.customerId ?? ""));
  const items = useStore((s) => s.getItemsByOrderId(id!));
  const photos = useStore((s) => s.getPhotosByOrderId(id!));

  const advanceOrderStatus = useStore((s) => s.advanceOrderStatus);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const updateOrder = useStore((s) => s.updateOrder);
  const addInstallationPhoto = useStore((s) => s.addInstallationPhoto);
  const removeInstallationPhoto = useStore((s) => s.removeInstallationPhoto);

  const [isEditing, setIsEditing] = useState(false);

  type FormItems = ReturnType<typeof useOrderForm>["items"];

  if (!order) {
    return (
      <div className="card p-16 text-center">
        <p className="text-walnut-500 mb-4">订单不存在</p>
        <Link to="/orders" className="btn-primary inline-block">
          返回订单列表
        </Link>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) addInstallationPhoto(order.id, dataUrl);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitEdit = (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerId?: string;
    items: FormItems;
    remark?: string;
  }) => {
    updateOrder(order.id, data as any);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-walnut-800">
              编辑订单
            </h1>
            <p className="text-walnut-500 text-sm mt-0.5">订单号 {order.orderNo}</p>
          </div>
        </div>
        <OrderForm
          customer={customer}
          order={order}
          orderItems={items}
          onSubmit={handleSubmitEdit}
          onCancel={() => setIsEditing(false)}
          submitText="保存修改"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-walnut-50 text-walnut-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-serif text-3xl font-bold text-walnut-800">
                订单详情
              </h1>
              <StatusBadge status={order.status} size="md" />
            </div>
            <p className="text-walnut-500 text-sm">
              订单号 <span className="font-mono">{order.orderNo}</span> · 下单于 {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> 编辑
          </button>
          <ProgressButton
            currentStatus={order.status}
            onAdvance={() => advanceOrderStatus(order.id)}
          />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">生产进度</h3>
        <StatusProgress currentStatus={order.status} />
        <div className="mt-6 flex items-center justify-center gap-2">
          {STATUS_FLOW.map((s, idx) => (
            <button
              key={s}
              onClick={() => setOrderStatus(order.id, s as OrderStatus)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                idx <= STATUS_FLOW.indexOf(order.status)
                  ? "text-walnut-700 bg-cream-100 hover:bg-cream-200"
                  : "text-walnut-300 bg-transparent hover:text-walnut-500"
              }`}
            >
              设为当前
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card p-6 col-span-2">
          <h3 className="section-title mb-5">
            <User className="w-5 h-5 text-copper-500" /> 客户信息
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">客户姓名</div>
                  <div className="font-medium text-walnut-800">
                    {customer?.name ?? "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">联系电话</div>
                  <div className="font-medium text-walnut-800">
                    {customer?.phone ?? "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-copper-gradient/20 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-copper-600" />
              </div>
              <div>
                <div className="text-xs text-walnut-400">安装地址</div>
                <div className="font-medium text-walnut-800 leading-relaxed">
                  {customer?.address ?? "-"}
                </div>
              </div>
            </div>
            {order.remark && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">备注</div>
                  <div className="font-medium text-walnut-800 leading-relaxed">
                    {order.remark}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-walnut-100">
            <Link
              to={`/customers/${customer?.id}`}
              className="text-sm text-copper-600 hover:text-copper-700 font-medium"
            >
              查看该客户历史订单 →
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-6 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-copper-gradient" />
            <h3 className="section-title mb-5">费用汇总</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-walnut-500 text-sm">型材总米数</span>
                <span className="font-semibold text-walnut-800">
                  {formatNumber(order.totalProfileMeters)} 米
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-walnut-500 text-sm">玻璃总面积</span>
                <span className="font-semibold text-walnut-800">
                  {formatNumber(order.totalGlassArea)} ㎡
                </span>
              </div>
              <div className="h-px bg-walnut-100 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-walnut-600 font-medium">订单总金额</span>
                <span className="text-2xl font-serif font-bold text-gradient-copper">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-5 text-base !text-lg">
              <Calendar className="w-5 h-5 text-copper-500" /> 时间线
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-placed" />
                <span className="text-walnut-500 w-16">创建</span>
                <span className="text-walnut-700">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-walnut-300" />
                <span className="text-walnut-500 w-16">更新</span>
                <span className="text-walnut-700">{formatDateTime(order.updatedAt)}</span>
              </div>
              {order.completedAt && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-completed" />
                  <span className="text-walnut-500 w-16">完工</span>
                  <span className="text-walnut-700">{formatDate(order.completedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">
          <Ruler className="w-5 h-5 text-copper-500" /> 门窗明细
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-walnut-400 border-b border-walnut-100">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">尺寸 (宽×高 mm)</th>
                <th className="pb-3 font-medium">型材颜色</th>
                <th className="pb-3 font-medium">玻璃类型</th>
                <th className="pb-3 font-medium">五金品牌</th>
                <th className="pb-3 font-medium text-right">型材/扇</th>
                <th className="pb-3 font-medium text-right">玻璃/扇</th>
                <th className="pb-3 font-medium text-right">单价</th>
                <th className="pb-3 font-medium text-right">数量</th>
                <th className="pb-3 font-medium text-right">小计</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-b border-walnut-50 last:border-0"
                >
                  <td className="py-4 text-walnut-400">{idx + 1}</td>
                  <td className="py-4 font-medium text-walnut-800">
                    {item.widthMm} × {item.heightMm}
                  </td>
                  <td className="py-4 text-walnut-600">{item.profileColor}</td>
                  <td className="py-4 text-walnut-600">
                    {GLASS_LABELS[item.glassType]}
                  </td>
                  <td className="py-4 text-walnut-600">{item.hardwareBrand}</td>
                  <td className="py-4 text-right text-walnut-600">
                    {formatNumber(calcItemProfileMeters(item.widthMm, item.heightMm))} 米
                  </td>
                  <td className="py-4 text-right text-walnut-600">
                    {formatNumber(calcItemGlassArea(item.widthMm, item.heightMm))} ㎡
                  </td>
                  <td className="py-4 text-right font-medium text-walnut-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right text-walnut-600">×{item.quantity}</td>
                  <td className="py-4 text-right font-semibold text-copper-600">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <Camera className="w-5 h-5 text-copper-500" /> 安装现场照片
          </h3>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-sm"
            >
              <Camera className="w-4 h-4" /> 上传照片
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="border-2 border-dashed border-walnut-200 rounded-xl py-16 text-center">
            <div className="text-walnut-300 text-5xl mb-3">🖼️</div>
            <p className="text-walnut-500 mb-4">暂无安装照片</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> 上传安装完成照片
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden border border-walnut-100 shadow-sm"
              >
                <img
                  src={photo.dataUrl}
                  alt="安装照片"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a
                    href={photo.dataUrl}
                    download={`${order.orderNo}-${photo.id}.jpg`}
                    className="p-2 rounded-lg bg-white/90 text-walnut-700 hover:bg-white transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("确定删除这张照片吗？")) {
                        removeInstallationPhoto(photo.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-white transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs">
                  {formatDate(photo.uploadedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
