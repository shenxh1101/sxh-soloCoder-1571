import { STATUS_FLOW, type OrderStatus } from "@/store/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/store/types";

interface Props {
  currentStatus: OrderStatus;
  showLabels?: boolean;
}

export default function StatusProgress({
  currentStatus,
  showLabels = true,
}: Props) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STATUS_FLOW.map((status, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={status} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300 ${
                    isDone
                      ? "bg-status-completed text-white"
                      : isCurrent
                      ? `${STATUS_COLORS[status]} text-white ring-4 ring-opacity-30 ring-offset-1`
                      : "bg-walnut-100 text-walnut-400"
                  } ${isCurrent ? STATUS_COLORS[status].replace("bg-", "ring-") : ""}`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded-full transition-all duration-300 ${
                      isDone ? "bg-status-completed" : "bg-walnut-100"
                    }`}
                  />
                )}
              </div>
              {showLabels && (
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent
                      ? "text-walnut-800"
                      : isDone
                      ? "text-walnut-500"
                      : "text-walnut-300"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
