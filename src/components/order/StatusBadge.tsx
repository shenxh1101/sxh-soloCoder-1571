import type { OrderStatus } from "@/store/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/store/types";

interface Props {
  status: OrderStatus;
  size?: "sm" | "md";
}

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export default function StatusBadge({ status, size = "sm" }: Props) {
  return (
    <span
      className={`badge text-white ${sizeMap[size]} ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
