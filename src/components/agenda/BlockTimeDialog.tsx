import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfessionals } from "@/hooks/useProfessionals";
import { TimeOffFormData } from "@/hooks/useTimeOff";
import { Ban } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date;
  defaultStart?: string;
  defaultEnd?: string;
  defaultProfessionalId?: string | null;
  onSubmit: (data: TimeOffFormData) => void | Promise<void>;
  isLoading?: boolean;
}

const QUICK_REASONS = ["Almoço", "Consulta", "Pausa", "Compromisso pessoal"];

function normalize(t?: string) {
  if (!t) return "";
  const parts = t.split(":");
  return `${parts[0].padStart(2, "0")}:${(parts[1] ?? "00").padStart(2, "0")}`;
}

export function BlockTimeDialog({
  open,
  onOpenChange,
  date,
  defaultStart,
  defaultEnd,
  defaultProfessionalId,
  onSubmit,
  isLoading,
}: Props) {
  const { professionals } = useProfessionals();
  const activeProfs = professionals.filter((p) => p.is_active);

  const [professionalId, setProfessionalId] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setProfessionalId(defaultProfessionalId || activeProfs[0]?.id || "");
    setStart(normalize(defaultStart) || "12:00");
    setEnd(normalize(defaultEnd) || "13:00");
    setReason("");
  }, [open, defaultStart, defaultEnd, defaultProfessionalId]);

  const canSubmit = professionalId && start && end && end > start && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      professional_id: professionalId,
      date,
      start_time: `${start}:00`,
      end_time: `${end}:00`,
      reason: reason.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-primary" /> Bloquear horário
          </DialogTitle>
          <DialogDescription>
            Marque um intervalo como indisponível para agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {activeProfs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Motivo (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Almoço"
              maxLength={80}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[11px] px-2 py-1 rounded-full bg-panel2 hover:bg-line2 text-tx2"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Bloquear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}