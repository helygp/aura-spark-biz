import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Clock, Loader2 } from "lucide-react";
import { useBusinessHours, BusinessHour } from "@/hooks/useBusinessHours";
import { toast } from "sonner";

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

interface RowState {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

function toHHMM(t: string) {
  return t.slice(0, 5);
}

export function BusinessHoursCard() {
  const { hours, isLoading, updateHour } = useBusinessHours();
  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    const next: Record<string, RowState> = {};
    for (const h of hours) {
      next[h.id] = {
        is_open: h.is_open,
        open_time: toHHMM(h.open_time),
        close_time: toHHMM(h.close_time),
      };
    }
    setRows(next);
  }, [hours]);

  const persist = async (h: BusinessHour, patch: Partial<RowState>) => {
    const current = rows[h.id] ?? {
      is_open: h.is_open,
      open_time: toHHMM(h.open_time),
      close_time: toHHMM(h.close_time),
    };
    const next = { ...current, ...patch };
    setRows((r) => ({ ...r, [h.id]: next }));
    if (next.open_time && next.close_time && next.open_time >= next.close_time) {
      toast.error("Horário de abertura deve ser anterior ao de fechamento.");
      return;
    }
    try {
      await updateHour.mutateAsync({
        id: h.id,
        is_open: next.is_open,
        open_time: next.open_time,
        close_time: next.close_time,
      });
    } catch {
      /* toast already fired in hook */
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Horário de Funcionamento
        </CardTitle>
        <CardDescription>
          Define os slots disponíveis na agenda e será usado pela página pública de agendamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {hours.map((h) => {
              const row = rows[h.id];
              if (!row) return null;
              return (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/40"
                >
                  <div className="sm:w-40 font-medium text-foreground">
                    {WEEKDAY_LABELS[h.weekday]}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.is_open}
                      onCheckedChange={(v) => persist(h, { is_open: v })}
                    />
                    <span className="text-sm text-muted-foreground w-16">
                      {row.is_open ? "Aberto" : "Fechado"}
                    </span>
                  </div>
                  {row.is_open && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={row.open_time}
                        onChange={(e) =>
                          setRows((r) => ({
                            ...r,
                            [h.id]: { ...row, open_time: e.target.value },
                          }))
                        }
                        onBlur={(e) => persist(h, { open_time: e.target.value })}
                        className="w-28 h-9"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={row.close_time}
                        onChange={(e) =>
                          setRows((r) => ({
                            ...r,
                            [h.id]: { ...row, close_time: e.target.value },
                          }))
                        }
                        onBlur={(e) => persist(h, { close_time: e.target.value })}
                        className="w-28 h-9"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}