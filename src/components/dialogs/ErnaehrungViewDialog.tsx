import type { Ernaehrung } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface ErnaehrungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Ernaehrung | null;
  onEdit: (record: Ernaehrung) => void;
}

export function ErnaehrungViewDialog({ open, onClose, record, onEdit }: ErnaehrungViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ernährung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum und Uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.mahlzeit_zeitpunkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mahlzeit</Label>
            <Badge variant="secondary">{record.fields.mahlzeit_typ?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung der Mahlzeit</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.mahlzeit_beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kalorien (kcal)</Label>
            <p className="text-sm">{record.fields.kalorien_aufnahme ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kohlenhydrate (g)</Label>
            <p className="text-sm">{record.fields.kohlenhydrate_g ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eiweiß (g)</Label>
            <p className="text-sm">{record.fields.eiweiss_g ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fett (g)</Label>
            <p className="text-sm">{record.fields.fett_g ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ballaststoffe (g)</Label>
            <p className="text-sm">{record.fields.ballaststoffe_g ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zucker (g)</Label>
            <p className="text-sm">{record.fields.zucker_g ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wasseraufnahme (ml)</Label>
            <p className="text-sm">{record.fields.wasseraufnahme_ml ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen_ernaehrung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}