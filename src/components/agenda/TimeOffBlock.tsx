import { X, Ban } from "lucide-react";
import { TimeOff } from "@/hooks/useTimeOff";

interface Props {
  timeOff: TimeOff;
  onDelete: () => void;
}

export function TimeOffBlock({ timeOff, onDelete }: Props) {
  const color = timeOff.professional?.color || "hsl(var(--muted-foreground))";
  return (
    <div
      className="h-full rounded-[12px] px-3 py-1.5 text-sm border border-dashed relative overflow-hidden"
      style={{
        borderColor: color,
        backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--muted) / 0.55) 0 6px, hsl(var(--muted) / 0.25) 6px 12px)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 h-full">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-tx1 font-display text-[13px]">
            <Ban className="w-3.5 h-3.5" style={{ color }} />
            {timeOff.start_time.slice(0, 5)} - {timeOff.end_time.slice(0, 5)}
          </div>
          <div className="text-[11.5px] text-tx2 truncate">
            {timeOff.reason || "Indisponível"}
            {timeOff.professional?.name && ` • ${timeOff.professional.name}`}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Remover este bloqueio?")) onDelete();
          }}
          className="text-tx4 hover:text-destructive rounded p-0.5"
          title="Remover bloqueio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}