'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationName, name, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || 'No se pudo registrar.');
      setLoading(false);
      return;
    }

    // Auto-login
    await signIn('credentials', { email, password, callbackUrl: '/Dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organización</label>
              <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre (opcional)</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              <div className="text-xs text-slate-500">Mínimo 8 caracteres.</div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? 'Creando…' : 'Crear cuenta'}
            </Button>

            <div className="text-sm text-slate-600">
              ¿Ya tenés cuenta?{' '}
              <a className="text-teal-700 hover:underline" href="/login">
                Ingresar
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
