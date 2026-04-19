import type { Koerpermesswerte } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface KoerpermesswerteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Koerpermesswerte | null;
  onEdit: (record: Koerpermesswerte) => void;
}

export function KoerpermesswerteViewDialog({ open, onClose, record, onEdit }: KoerpermesswerteViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Körpermesswerte anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum und Uhrzeit der Messung</Label>
            <p className="text-sm">{formatDate(record.fields.messung_zeitpunkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gewicht (kg)</Label>
            <p className="text-sm">{record.fields.gewicht_kg ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körpergröße (cm)</Label>
            <p className="text-sm">{record.fields.koerpergroesse_cm ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">BMI</Label>
            <p className="text-sm">{record.fields.bmi ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körperfettanteil (%)</Label>
            <p className="text-sm">{record.fields.koerperfettanteil ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutdruck systolisch (mmHg)</Label>
            <p className="text-sm">{record.fields.blutdruck_systolisch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutdruck diastolisch (mmHg)</Label>
            <p className="text-sm">{record.fields.blutdruck_diastolisch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Puls (Schläge/min)</Label>
            <p className="text-sm">{record.fields.puls ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutzucker (mg/dL)</Label>
            <p className="text-sm">{record.fields.blutzucker ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körpertemperatur (°C)</Label>
            <p className="text-sm">{record.fields.koerpertemperatur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sauerstoffsättigung (%)</Label>
            <p className="text-sm">{record.fields.sauerstoffsaettigung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_koerper ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}