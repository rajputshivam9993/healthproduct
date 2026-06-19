import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useRegisterDoctor } from '@/hooks/use-doctors';
import { SPECIALIZATIONS } from '@/constants/specializations';

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone (10 digits)', type: 'tel', required: true },
  { name: 'qualification', label: 'Qualification', type: 'text', required: true },
  { name: 'degree', label: 'Degree', type: 'text', required: true },
  { name: 'medicalRegNumber', label: 'Medical reg. number', type: 'text', required: true },
  { name: 'city', label: 'City', type: 'text', required: true },
  { name: 'state', label: 'State', type: 'text', required: true },
  { name: 'latitude', label: 'Latitude (optional)', type: 'text', required: false },
  { name: 'longitude', label: 'Longitude (optional)', type: 'text', required: false },
] as const;

/** Doctor registration form (Req 2.1, 17.5) — multipart submit with optional document. */
export function DoctorRegisterPage() {
  const navigate = useNavigate();
  const registerDoctor = useRegisterDoctor();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    // Drop empty optional fields so backend validation doesn't reject blanks.
    for (const key of ['latitude', 'longitude', 'specialization']) {
      if (!form.get(key)) form.delete(key);
    }
    if (!(form.get('document') as File)?.size) form.delete('document');

    try {
      await registerDoctor.mutateAsync(form);
      toast.success('Doctor registered successfully');
      navigate('/doctors');
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data as { message?: string })?.message ?? 'Registration failed')
          : 'Registration failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Doctors', to: '/doctors' }, { label: 'Register' }]} />
      <h1 className="text-2xl font-bold tracking-tight">Register doctor</h1>

      <Card>
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {FIELDS.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input id={f.name} name={f.name} type={f.type} required={f.required} />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization</Label>
              <Select id="specialization" name="specialization" defaultValue="">
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Clinic address</Label>
              <Input id="address" name="address" type="text" required />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="document">Medical document (PDF/JPEG/PNG, ≤10MB)</Label>
              <Input id="document" name="document" type="file" accept=".pdf,image/jpeg,image/png" />
            </div>

            {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={registerDoctor.isPending}>
                {registerDoctor.isPending ? 'Registering…' : 'Register doctor'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/doctors')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
