import { useState, useRef, useEffect, useMemo } from "react";
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
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  Coins,
  MoreHorizontal,
  ZoomIn,
  CalendarDays,
  UserCheck,
  FileSpreadsheet,
  Clock,
  HardHat,
} from "lucide-react";
import { useStore } from "@/store";
import {
  STATUS_FLOW,
  GLASS_LABELS,
  type OrderStatus,
  type PaymentType,
  PAYMENT_TYPE_LABELS,
} from "@/store/types";
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

  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const windowItems = useStore((s) => s.windowItems);
  const photos = useStore((s) => s.photos);
  const payments = useStore((s) => s.payments);
  const appointments = useStore((s) => s.appointments);

  const order = useMemo(
    () => orders.find((o) => o.id === id),
    [orders, id]
  );
  const customer = useMemo(
    () => customers.find((c) => c.id === order?.customerId),
    [customers, order?.customerId]
  );
  const orderItems = useMemo(
    () => windowItems.filter((i) => i.orderId === id),
    [windowItems, id]
  );
  const orderPhotos = useMemo(
    () => photos.filter((p) => p.orderId === id),
    [photos, id]
  );
  const orderPayments = useMemo(
    () => payments.filter((p) => p.orderId === id),
    [payments, id]
  );
  const orderAppointment = useMemo(
    () => appointments.find((a) => a.orderId === id),
    [appointments, id]
  );
  const { totalPaid, totalUnpaid } = useMemo(() => {
    const paid = orderPayments.reduce((s, p) => s + p.amount, 0);
    return {
      totalPaid: paid,
      totalUnpaid: order ? order.totalAmount - paid : 0,
    };
  }, [orderPayments, order]);

  const advanceOrderStatus = useStore((s) => s.advanceOrderStatus);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const updateOrder = useStore((s) => s.updateOrder);
  const addInstallationPhoto = useStore((s) => s.addInstallationPhoto);
  const removeInstallationPhoto = useStore((s) => s.removeInstallationPhoto);
  const addPayment = useStore((s) => s.addPayment);
  const removePayment = useStore((s) => s.removePayment);
  const setAppointment = useStore((s) => s.setAppointment);
  const removeAppointment = useStore((s) => s.removeAppointment);

  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentType: "deposit" as PaymentType,
    paymentDate: new Date().toISOString().split("T")[0],
    remark: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: "",
    installer: "",
    remark: "",
  });

  type FormItems = ReturnType<typeof useOrderForm>["items"];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewPhoto(null);
        setShowPaymentModal(false);
        setShowAppointmentModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleOpenAppointmentModal = () => {
    if (orderAppointment) {
      setAppointmentForm({
        appointmentDate: orderAppointment.appointmentDate,
        installer: orderAppointment.installer,
        remark: orderAppointment.remark || "",
      });
    } else {
      setAppointmentForm({
        appointmentDate: "",
        installer: "",
        remark: "",
      });
    }
    setShowAppointmentModal(true);
  };

  const handleSetAppointment = () => {
    if (!appointmentForm.appointmentDate) {
      alert("请选择预约安装日期");
      return;
    }
    if (!appointmentForm.installer.trim()) {
      alert("请输入安装师傅姓名");
      return;
    }
    setAppointment(order.id, {
      appointmentDate: appointmentForm.appointmentDate,
      installer: appointmentForm.installer.trim(),
      remark: appointmentForm.remark.trim() || undefined,
    });
    setShowAppointmentModal(false);
  };

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

  const handleAddPayment = () => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      alert("请输入有效的收款金额");
      return;
    }
    addPayment(order.id, {
      amount,
      paymentType: paymentForm.paymentType,
      paymentDate: paymentForm.paymentDate,
      remark: paymentForm.remark || undefined,
    });
    setPaymentForm({
      amount: "",
      paymentType: "deposit",
      paymentDate: new Date().toISOString().split("T")[0],
      remark: "",
    });
    setShowPaymentModal(false);
  };

  const getPaymentTypeIcon = (type: PaymentType) => {
    switch (type) {
      case "deposit":
        return <Banknote className="w-4 h-4" />;
      case "balance":
        return <CreditCard className="w-4 h-4" />;
      case "installment":
        return <Coins className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
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
          orderItems={orderItems}
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
              {totalUnpaid > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-installing/10 text-status-installing text-xs font-medium">
                  <Wallet className="w-3 h-3" />
                  待收 {formatCurrency(totalUnpaid)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-completed/10 text-status-completed text-xs font-medium">
                  <Wallet className="w-3 h-3" />
                  已结清
                </span>
              )}
            </div>
            <p className="text-walnut-500 text-sm">
              订单号 <span className="font-mono">{order.orderNo}</span> · 下单于 {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/orders/${order.id}/quote`}
            target="_blank"
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> 报价单
          </Link>
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
              <div className="h-px bg-walnut-100 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-walnut-500 text-sm flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-status-completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M16 21V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10"/></svg>
                  已收款
                </span>
                <span className="font-semibold text-status-completed">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-walnut-500 text-sm flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-status-installing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10v4"/><path d="M8 10v4"/><path d="M16 10v4"/></svg>
                  待收款
                </span>
                <span className={`font-semibold ${totalUnpaid > 0 ? "text-status-installing" : "text-status-completed"}`}>
                  {formatCurrency(totalUnpaid)}
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
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">
            <CalendarDays className="w-5 h-5 text-copper-500" /> 安装预约
          </h3>
          <div className="flex items-center gap-2">
            {orderAppointment && (
              <button
                onClick={() => {
                  if (confirm("确定取消这个安装预约吗？")) {
                    removeAppointment(orderAppointment.id);
                  }
                }}
                className="btn-secondary flex items-center gap-2 !py-2 !px-3 !text-sm !text-red-500 hover:!bg-red-50"
              >
                <X className="w-4 h-4" /> 取消预约
              </button>
            )}
            <button
              onClick={handleOpenAppointmentModal}
              className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-sm"
            >
              <Clock className="w-4 h-4" /> {orderAppointment ? "修改预约" : "预约安装"}
            </button>
          </div>
        </div>

        {!orderAppointment ? (
          <div className="border-2 border-dashed border-walnut-200 rounded-xl py-12 text-center">
            <div className="text-walnut-300 text-5xl mb-3">📅</div>
            <p className="text-walnut-500 mb-4">暂无安装预约</p>
            <button
              onClick={handleOpenAppointmentModal}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 立即预约安装
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cream-50 border border-walnut-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">预约日期</div>
                  <div className="font-semibold text-walnut-800">
                    {formatDate(orderAppointment.appointmentDate)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 border border-walnut-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">安装师傅</div>
                  <div className="font-semibold text-walnut-800">
                    {orderAppointment.installer}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 border border-walnut-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-copper-600" />
                </div>
                <div>
                  <div className="text-xs text-walnut-400">上门备注</div>
                  <div className="font-medium text-walnut-700 text-sm leading-relaxed">
                    {orderAppointment.remark || "暂无备注"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">
            <Wallet className="w-5 h-5 text-copper-500" /> 收款记录
          </h3>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-sm"
          >
            <Plus className="w-4 h-4" /> 登记收款
          </button>
        </div>

        {orderPayments.length === 0 ? (
          <div className="border-2 border-dashed border-walnut-200 rounded-xl py-12 text-center">
            <div className="text-walnut-300 text-5xl mb-3">💰</div>
            <p className="text-walnut-500 mb-4">暂无收款记录</p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 登记第一笔收款
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orderPayments
              .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
              .map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-cream-50 border border-walnut-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-copper-gradient/15 flex items-center justify-center text-copper-600">
                      {getPaymentTypeIcon(payment.paymentType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-walnut-800">
                          {PAYMENT_TYPE_LABELS[payment.paymentType]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-copper-gradient/10 text-copper-700">
                          {formatDate(payment.paymentDate)}
                        </span>
                      </div>
                      {payment.remark && (
                        <div className="text-xs text-walnut-400">
                          {payment.remark}
                        </div>
                      )}
                      <div className="text-xs text-walnut-400 mt-0.5">
                        登记于 {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-serif font-bold text-copper-600">
                        + {formatCurrency(payment.amount)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("确定删除这条收款记录吗？")) {
                          removePayment(payment.id);
                        }
                      }}
                      className="p-2 rounded-lg text-walnut-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
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
              {orderItems.map((item, idx) => (
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

        {orderPhotos.length === 0 ? (
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
            {orderPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden border border-walnut-100 shadow-sm"
              >
                <img
                  src={photo.dataUrl}
                  alt="安装照片"
                  className="w-full aspect-square object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => setPreviewPhoto(photo.dataUrl)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setPreviewPhoto(photo.dataUrl)}
                    className="p-2 rounded-lg bg-white/90 text-walnut-700 hover:bg-white transition-colors"
                    title="预览大图"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
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
                <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs flex items-center justify-between">
                  <span>{formatDateTime(photo.uploadedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-walnut-800">
                登记收款
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  收款金额 (元)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="请输入收款金额"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  收款类型
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentType: value as PaymentType,
                        })
                      }
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        paymentForm.paymentType === value
                          ? "bg-copper-gradient text-white shadow-copper"
                          : "bg-cream-50 text-walnut-600 hover:bg-cream-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  收款日期
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  备注 (选填)
                </label>
                <textarea
                  rows={2}
                  placeholder="如：现金/微信/银行转账、收据编号等"
                  value={paymentForm.remark}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, remark: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-walnut-500">
                待收款余额：
                <span className="font-semibold text-status-installing">
                  {formatCurrency(totalUnpaid)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary !py-2 !px-4"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPayment}
                  className="btn-primary flex items-center gap-2 !py-2 !px-4"
                >
                  <Save className="w-4 h-4" /> 确认收款
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-walnut-800">
                {orderAppointment ? "修改安装预约" : "预约安装"}
              </h3>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  预约安装日期
                </label>
                <input
                  type="date"
                  value={appointmentForm.appointmentDate}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  安装师傅
                </label>
                <input
                  type="text"
                  placeholder="请输入安装师傅姓名"
                  value={appointmentForm.installer}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, installer: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  上门备注 (选填)
                </label>
                <textarea
                  rows={3}
                  placeholder="如：需携带工具、客户联系方式、注意事项等"
                  value={appointmentForm.remark}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, remark: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="btn-secondary !py-2 !px-4"
              >
                取消
              </button>
              <button
                onClick={handleSetAppointment}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
              >
                <Save className="w-4 h-4" /> 确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewPhoto}
            alt="预览大图"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            点击任意位置关闭 · ESC 键退出
          </div>
        </div>
      )}
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
