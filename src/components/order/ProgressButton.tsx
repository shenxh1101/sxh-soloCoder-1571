import { ArrowRight, Check } from "lucide-react";
import type { OrderStatus } from "@/store/types";
import { STATUS_LABELS, STATUS_FLOW, STATUS_COLORS } from "@/store/types";

interface Props {
  currentStatus: OrderStatus;
  onAdvance: () => void;
  disabled?: boolean;
}

export default function ProgressButton({
  currentStatus,
  onAdvance,
  disabled,
}: Props) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const isCompleted = currentIdx >= STATUS_FLOW.length - 1;
  const nextStatus = isCompleted ? null : STATUS_FLOW[currentIdx + 1];

  if (isCompleted) {
    return (
      <button
        disabled
        className="btn-status bg-status-completed flex items-center gap-1.5 cursor-default opacity-90"
      >
        <Check className="w-4 h-4" />
        已完工
      </button>
    );
  }

  return (
    <button
      onClick={onAdvance}
      disabled={disabled}
      className={`btn-status ${STATUS_COLORS[nextStatus!]} flex items-center gap-1.5 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      转为 {STATUS_LABELS[nextStatus!]}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
