import { useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { CalendarClock, Trash2, Video, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDoctors } from '@/hooks/use-doctors';
import { useCreateSlot, useDeleteSlot, useDoctorSlots } from '@/hooks/use-slots';

/** Availability slot management for a selected doctor (Req 17.8, 17.9). */
export function SlotsPage() {
  const { data: doctors } = useDoctors({ pageSize: 50 });
  const [doctorId, setDoctorId] = useState('');
  const { data: slots, isLoading } = useDoctorSlots(doctorId || undefined);
  const createSlot = useCreateSlot(doctorId);
  const deleteSlot = useDeleteSlot(doctorId);

  const [date, setDate] = useState('');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('10:30');
  const [type, setType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date) {
      toast.error('Select a doctor and date');
      return;
    }
    try {
      await createSlot.mutateAsync({
        startTime: new Date(`${date}T${start}`).toISOString(),
        endTime: new Date(`${date}T${end}`).toISOString(),
        consultationType: type,
      });
      toast.success('Slot created');
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data as { message?: string })?.message ?? 'Could not create slot')
          : 'Could not create slot';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Availability Slots</h1>

      <div className="max-w-md space-y-1.5">
        <Label>Doctor</Label>
        <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Select a doctor</option>
          {doctors?.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.specialization ?? '—'}
            </option>
          ))}
        </Select>
      </div>

      {doctorId && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create slot</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={submit}>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="start">Start</Label>
                    <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="end">End</Label>
                    <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onChange={(e) => setType(e.target.value as 'VIDEO' | 'IN_PERSON')}>
                    <option value="VIDEO">Video</option>
                    <option value="IN_PERSON">In-person</option>
                  </Select>
                </div>
                <Button type="submit" disabled={createSlot.isPending}>
                  {createSlot.isPending ? 'Creating…' : 'Create slot'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!isLoading && slots?.length === 0 && (
                <p className="text-sm text-muted-foreground">No slots scheduled.</p>
              )}
              {slots?.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 rounded-md border p-3">
                  {slot.consultationType === 'VIDEO' ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{new Date(slot.startTime).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      until {new Date(slot.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                  {slot.isBooked ? (
                    <Badge variant="info">Booked</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSlot.mutate(slot.id)}
                      aria-label="Delete slot"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {!doctorId && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <CalendarClock className="h-10 w-10" />
          <p>Select a doctor to manage their availability.</p>
        </div>
      )}
    </div>
  );
}
