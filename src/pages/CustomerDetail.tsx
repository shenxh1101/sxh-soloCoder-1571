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
  MessageCircle,
  Clock,
  X,
  Save,
  Trash2,
  CalendarDays,
  User,
  Wrench,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  FileText,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import StatusBadge from "@/components/order/StatusBadge";
import StatusProgress from "@/components/order/StatusProgress";
import { formatCurrency, formatDate, formatDateTime, copyToClipboard } from "@/utils";
import {
  AFTER_SALES_STATUS_LABELS,
  type AfterSalesStatus,
} from "@/store/types";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const payments = useStore((s) => s.payments);
  const followUps = useStore((s) => s.followUps);
  const afterSalesTickets = useStore((s) => s.afterSalesTickets);
  const addFollowUp = useStore((s) => s.addFollowUp);
  const removeFollowUp = useStore((s) => s.removeFollowUp);
  const addAfterSalesTicket = useStore((s) => s.addAfterSalesTicket);
  const updateAfterSalesStatus = useStore((s) => s.updateAfterSalesStatus);
  const removeAfterSalesTicket = useStore((s) => s.removeAfterSalesTicket);
  const [copied, setCopied] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showAfterSalesModal, setShowAfterSalesModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [followUpForm, setFollowUpForm] = useState({
    contactDate: new Date().toISOString().split("T")[0],
    content: "",
    result: "",
    nextFollowUpDate: "",
  });
  const [afterSalesForm, setAfterSalesForm] = useState({
    issueType: "",
    description: "",
    appointmentDate: "",
    handler: "",
    orderId: "",
  });
  const [updateStatusForm, setUpdateStatusForm] = useState({
    status: "processing" as AfterSalesStatus,
    result: "",
  });

  const customer = useMemo(
    () => customers.find((c) => c.id === id),
    [customers, id]
  );

  const customerOrders = useMemo(
    () => orders.filter((o) => o.customerId === id),
    [orders, id]
  );

  const {
    totalSpent,
    totalPaid,
    totalUnpaid,
    completedOrders,
    avgOrder,
  } = useMemo(() => {
    const spent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paid = customerOrders.reduce((sum, o) => {
      const orderPayments = payments.filter((p) => p.orderId === o.id);
      return sum + orderPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);
    const completed = customerOrders.filter((o) => o.status === "completed");
    const avg =
      customerOrders.length > 0
        ? Math.round(spent / customerOrders.length)
        : 0;
    return {
      totalSpent: spent,
      totalPaid: paid,
      totalUnpaid: spent - paid,
      completedOrders: completed,
      avgOrder: avg,
    };
  }, [customerOrders, payments]);

  const getOrderTotalPaid = (orderId: string) => {
    return payments
      .filter((p) => p.orderId === orderId)
      .reduce((s, p) => s + p.amount, 0);
  };

  const customerFollowUps = useMemo(
    () =>
      followUps
        .filter((f) => f.customerId === id)
        .sort(
          (a, b) =>
            new Date(b.contactDate).getTime() - new Date(a.contactDate).getTime()
        ),
    [followUps, id]
  );

  const customerAfterSalesTickets = useMemo(
    () =>
      afterSalesTickets
        .filter((t) => t.customerId === id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [afterSalesTickets, id]
  );

  const getStatusIcon = (status: AfterSalesStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Wrench className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: AfterSalesStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFollowUpModal(false);
        setShowAfterSalesModal(false);
        setShowUpdateStatusModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleOpenAfterSalesModal = () => {
    setAfterSalesForm({
      issueType: "",
      description: "",
      appointmentDate: "",
      handler: "",
      orderId: "",
    });
    setShowAfterSalesModal(true);
  };

  const handleAddAfterSalesTicket = () => {
    if (!afterSalesForm.issueType.trim()) {
      alert("请选择问题类型");
      return;
    }
    if (!afterSalesForm.description.trim()) {
      alert("请填写问题描述");
      return;
    }
    addAfterSalesTicket({
      customerId: id!,
      issueType: afterSalesForm.issueType.trim(),
      description: afterSalesForm.description.trim(),
      appointmentDate: afterSalesForm.appointmentDate || undefined,
      handler: afterSalesForm.handler.trim() || undefined,
      orderId: afterSalesForm.orderId || undefined,
    });
    setShowAfterSalesModal(false);
  };

  const handleOpenUpdateStatusModal = (ticketId: string) => {
    const ticket = customerAfterSalesTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    setSelectedTicketId(ticketId);
    setUpdateStatusForm({
      status: ticket.status,
      result: ticket.result || "",
    });
    setShowUpdateStatusModal(true);
  };

  const handleUpdateAfterSalesStatus = () => {
    if (!selectedTicketId) return;
    updateAfterSalesStatus(
      selectedTicketId,
      updateStatusForm.status,
      updateStatusForm.result.trim() || undefined
    );
    setShowUpdateStatusModal(false);
    setSelectedTicketId(null);
  };

  const handleAddFollowUp = () => {
    if (!followUpForm.content.trim()) {
      alert("请填写沟通内容");
      return;
    }
    if (!followUpForm.result.trim()) {
      alert("请填写处理结果");
      return;
    }
    addFollowUp(id!, {
      contactDate: followUpForm.contactDate,
      content: followUpForm.content.trim(),
      result: followUpForm.result.trim(),
      nextFollowUpDate: followUpForm.nextFollowUpDate.trim() || undefined,
    });
    setFollowUpForm({
      contactDate: new Date().toISOString().split("T")[0],
      content: "",
      result: "",
      nextFollowUpDate: "",
    });
    setShowFollowUpModal(false);
  };

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

        <div className="relative grid grid-cols-5 gap-4 mt-8 pt-8 border-t border-walnut-100">
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <ShoppingBag className="w-4 h-4 text-copper-500" />
              <span className="text-xs text-walnut-400">历史订单</span>
            </div>
            <div className="text-2xl font-serif font-bold text-walnut-800">
              {customerOrders.length}
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
              <svg className="w-4 h-4 text-status-completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M16 21V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10"/></svg>
              <span className="text-xs text-walnut-400">已收款</span>
            </div>
            <div className="text-2xl font-serif font-bold text-status-completed">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-cream-50">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <svg className="w-4 h-4 text-status-installing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10v4"/><path d="M8 10v4"/><path d="M16 10v4"/></svg>
              <span className="text-xs text-walnut-400">待收款</span>
            </div>
            <div className="text-2xl font-serif font-bold text-status-installing">
              {formatCurrency(totalUnpaid)}
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex justify-end">
          <Link
            to={`/orders/new?customerId=${customer.id}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 为该客户新建订单
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">历史订单记录</h3>

        {customerOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-walnut-300 text-4xl mb-3">📦</div>
            <p className="text-walnut-500">该客户暂无订单记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customerOrders
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((order) => {
                const orderPaid = getOrderTotalPaid(order.id);
                const orderUnpaid = order.totalAmount - orderPaid;
                return (
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
                    <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
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
                      <div className="flex items-center gap-2 text-walnut-500">
                        <span className="text-walnut-400">已收</span>
                        <span className="font-medium text-status-completed">
                          {formatCurrency(orderPaid)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-walnut-500">
                        <span className="text-walnut-400">未收</span>
                        <span className={`font-medium ${orderUnpaid > 0 ? "text-status-installing" : "text-status-completed"}`}>
                          {formatCurrency(orderUnpaid)}
                        </span>
                      </div>
                      {order.remark && (
                        <div className="flex items-center gap-2 text-walnut-500 truncate">
                          <span className="text-walnut-400">备注</span>
                          <span className="font-medium text-walnut-600 truncate">
                            {order.remark}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <MessageCircle className="w-5 h-5 text-copper-500" /> 回访记录
          </h3>
          <button
            onClick={() => setShowFollowUpModal(true)}
            className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-sm"
          >
            <Plus className="w-4 h-4" /> 新增回访
          </button>
        </div>

        {customerFollowUps.length === 0 ? (
          <div className="border-2 border-dashed border-walnut-200 rounded-xl py-12 text-center">
            <div className="text-walnut-300 text-5xl mb-3">📞</div>
            <p className="text-walnut-500 mb-4">暂无回访记录</p>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 记录第一次回访
            </button>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-copper-400 via-copper-300 to-walnut-200" />
            <div className="space-y-6">
              {customerFollowUps.map((followUp, index) => {
                const hasNextFollowUp = followUp.nextFollowUpDate;
                const nextDate = hasNextFollowUp ? new Date(followUp.nextFollowUpDate!) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = nextDate && nextDate < today;
                const isTomorrow =
                  nextDate &&
                  Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) === 1;
                const isToday =
                  nextDate &&
                  Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) === 0;

                return (
                  <div key={followUp.id} className="relative">
                    <div
                      className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-copper-gradient shadow-copper"
                          : "bg-walnut-100 border-2 border-walnut-200"
                      }`}
                    >
                      {index === 0 ? (
                        <Clock className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-walnut-400" />
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-cream-50 border border-walnut-100 hover:border-copper-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-copper-500/10 text-copper-700 text-xs font-medium">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(followUp.contactDate)}
                          </span>
                          <span className="text-xs text-walnut-400">
                            {formatDateTime(followUp.createdAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm("确定删除这条回访记录吗？")) {
                              removeFollowUp(followUp.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-walnut-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-walnut-400 mb-1">沟通内容</div>
                          <div className="text-sm text-walnut-700 leading-relaxed whitespace-pre-wrap">
                            {followUp.content}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-walnut-400 mb-1">处理结果</div>
                          <div className="text-sm text-walnut-700 leading-relaxed whitespace-pre-wrap">
                            {followUp.result}
                          </div>
                        </div>
                        {hasNextFollowUp && (
                          <div className="pt-3 border-t border-walnut-100">
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                isOverdue
                                  ? "bg-red-500/10 text-red-600"
                                  : isToday
                                  ? "bg-status-installing/10 text-status-installing"
                                  : isTomorrow
                                  ? "bg-copper-500/10 text-copper-600"
                                  : "bg-walnut-100 text-walnut-600"
                              }`}
                            >
                              <CalendarDays className="w-4 h-4" />
                              <span className="font-medium">下次跟进：</span>
                              <span>
                                {formatDate(followUp.nextFollowUpDate!)}
                                {isOverdue && " (已逾期)"}
                                {isToday && " (今天)"}
                                {isTomorrow && " (明天)"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <Wrench className="w-5 h-5 text-copper-500" /> 售后工单
          </h3>
          <button
            onClick={handleOpenAfterSalesModal}
            className="btn-primary flex items-center gap-2 !py-2 !px-3 !text-sm"
          >
            <Plus className="w-4 h-4" /> 新增工单
          </button>
        </div>

        {customerAfterSalesTickets.length === 0 ? (
          <div className="border-2 border-dashed border-walnut-200 rounded-xl py-12 text-center">
            <div className="text-walnut-300 text-5xl mb-3">🔧</div>
            <p className="text-walnut-500 mb-4">暂无售后工单</p>
            <button
              onClick={handleOpenAfterSalesModal}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 记录第一笔售后
            </button>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-orange-400 via-orange-300 to-walnut-200" />
            <div className="space-y-6">
              {customerAfterSalesTickets.map((ticket, index) => {
                const relatedOrder = customerOrders.find(
                  (o) => o.id === ticket.orderId
                );
                return (
                  <div key={ticket.id} className="relative">
                    <div
                      className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-orange-gradient shadow-orange"
                          : "bg-walnut-100 border-2 border-walnut-200"
                      }`}
                    >
                      {index === 0 ? (
                        <Wrench className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-walnut-400" />
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-cream-50 border border-walnut-100 hover:border-orange-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {getStatusIcon(ticket.status)}
                            {AFTER_SALES_STATUS_LABELS[ticket.status]}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-copper-500/10 text-copper-700 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {ticket.issueType}
                          </span>
                          {relatedOrder && (
                            <Link
                              to={`/orders/${relatedOrder.id}`}
                              target="_blank"
                              className="text-xs text-walnut-400 hover:text-copper-600"
                            >
                              订单 {relatedOrder.orderNo}
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleOpenUpdateStatusModal(ticket.id)
                            }
                            className="p-1.5 rounded-lg text-walnut-400 hover:text-copper-600 hover:bg-copper-50 transition-colors"
                            title="更新状态"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm("确定删除这条售后工单吗？")
                              ) {
                                removeAfterSalesTicket(ticket.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-walnut-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-walnut-400 mb-2">
                        {formatDateTime(ticket.createdAt)}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-walnut-400 mb-1">
                            问题描述
                          </div>
                          <div className="text-sm text-walnut-700 leading-relaxed whitespace-pre-wrap">
                            {ticket.description}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {ticket.appointmentDate && (
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-walnut-400 mb-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                预约日期
                              </div>
                              <div className="text-sm text-walnut-700">
                                {formatDate(ticket.appointmentDate)}
                              </div>
                            </div>
                          )}
                          {ticket.handler && (
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-walnut-400 mb-1">
                                <UserCheck className="w-3.5 h-3.5" />
                                处理师傅
                              </div>
                              <div className="text-sm text-walnut-700">
                                {ticket.handler}
                              </div>
                            </div>
                          )}
                        </div>

                        {ticket.result && (
                          <div className="pt-3 border-t border-walnut-100">
                            <div className="text-xs text-walnut-400 mb-1">
                              处理结果
                            </div>
                            <div className="text-sm text-walnut-700 leading-relaxed whitespace-pre-wrap">
                              {ticket.result}
                            </div>
                            {ticket.completedAt && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ 已于 {formatDate(ticket.completedAt)} 完成
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-walnut-800">
                新增回访记录
              </h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  沟通日期
                </label>
                <input
                  type="date"
                  value={followUpForm.contactDate}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, contactDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  沟通内容
                </label>
                <textarea
                  rows={3}
                  placeholder="客户打电话问了什么？有什么需求或疑问？"
                  value={followUpForm.content}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, content: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  处理结果
                </label>
                <textarea
                  rows={3}
                  placeholder="我们是怎么处理的？给客户的答复是什么？"
                  value={followUpForm.result}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, result: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  下次跟进日期 (选填)
                </label>
                <input
                  type="date"
                  value={followUpForm.nextFollowUpDate}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, nextFollowUpDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                />
                <p className="mt-1 text-xs text-walnut-400">
                  设置下次跟进时间，系统会在客户详情中标注提醒
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="btn-secondary !py-2 !px-4"
              >
                取消
              </button>
              <button
                onClick={handleAddFollowUp}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
              >
                <Save className="w-4 h-4" /> 保存记录
              </button>
            </div>
          </div>
        </div>
      )}

      {showAfterSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-walnut-800">
                新增售后工单
              </h3>
              <button
                onClick={() => setShowAfterSalesModal(false)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  问题类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["漏水问题", "五金松动", "开关异响", "玻璃问题", "密封问题", "其他问题"].map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setAfterSalesForm({ ...afterSalesForm, issueType: type })
                        }
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          afterSalesForm.issueType === type
                            ? "bg-copper-gradient text-white shadow-copper"
                            : "bg-cream-50 text-walnut-600 hover:bg-cream-100"
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  关联订单 (选填)
                </label>
                <select
                  value={afterSalesForm.orderId}
                  onChange={(e) =>
                    setAfterSalesForm({ ...afterSalesForm, orderId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                >
                  <option value="">不关联订单</option>
                  {customerOrders
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNo} - {formatDate(order.createdAt)} -{" "}
                        {formatCurrency(order.totalAmount)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  问题描述
                </label>
                <textarea
                  rows={3}
                  placeholder="请详细描述客户反映的问题..."
                  value={afterSalesForm.description}
                  onChange={(e) =>
                    setAfterSalesForm({ ...afterSalesForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-2">
                    预约处理日期
                  </label>
                  <input
                    type="date"
                    value={afterSalesForm.appointmentDate}
                    onChange={(e) =>
                      setAfterSalesForm({
                        ...afterSalesForm,
                        appointmentDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-2">
                    处理师傅
                  </label>
                  <input
                    type="text"
                    placeholder="请输入师傅姓名"
                    value={afterSalesForm.handler}
                    onChange={(e) =>
                      setAfterSalesForm({ ...afterSalesForm, handler: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAfterSalesModal(false)}
                className="btn-secondary !py-2 !px-4"
              >
                取消
              </button>
              <button
                onClick={handleAddAfterSalesTicket}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
              >
                <Save className="w-4 h-4" /> 保存工单
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-walnut-800">
                更新工单状态
              </h3>
              <button
                onClick={() => setShowUpdateStatusModal(false)}
                className="p-2 rounded-lg hover:bg-walnut-50 text-walnut-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  工单状态
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(AFTER_SALES_STATUS_LABELS).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setUpdateStatusForm({
                            ...updateStatusForm,
                            status: value as AfterSalesStatus,
                          })
                        }
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                          updateStatusForm.status === value
                            ? "bg-copper-gradient text-white shadow-copper"
                            : "bg-cream-50 text-walnut-600 hover:bg-cream-100"
                        }`}
                      >
                        {getStatusIcon(value as AfterSalesStatus)}
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-walnut-700 mb-2">
                  处理结果
                </label>
                <textarea
                  rows={4}
                  placeholder="请填写处理结果和客户反馈..."
                  value={updateStatusForm.result}
                  onChange={(e) =>
                    setUpdateStatusForm({
                      ...updateStatusForm,
                      result: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-walnut-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-all text-walnut-800 resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowUpdateStatusModal(false)}
                className="btn-secondary !py-2 !px-4"
              >
                取消
              </button>
              <button
                onClick={handleUpdateAfterSalesStatus}
                className="btn-primary flex items-center gap-2 !py-2 !px-4"
              >
                <Save className="w-4 h-4" /> 确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
