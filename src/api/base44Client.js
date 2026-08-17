// Compatibility layer to avoid refactoring the whole UI.
// It mimics the previous base44.entities.* interface but calls our Next.js API routes.

import { signOut } from 'next-auth/react';

async function apiFetch(path, { method = 'GET', body, params } = {}) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error || res.statusText);
    e.status = res.status;
    e.data = err;
    throw e;
  }

  return res.json();
}

function makeEntity(resource) {
  return {
    list: () => apiFetch(`/api/${resource}`),
    filter: (filters = {}) => apiFetch(`/api/${resource}`, { params: filters }),
    create: (data) => apiFetch(`/api/${resource}`, { method: 'POST', body: data }),
    bulkCreate: async (records) => {
      const out = [];
      for (const r of records) out.push(await apiFetch(`/api/${resource}`, { method: 'POST', body: r }));
      return out;
    },
    update: (id, data) => apiFetch(`/api/${resource}/${id}`, { method: 'PUT', body: data }),
    delete: (id) => apiFetch(`/api/${resource}/${id}`, { method: 'DELETE' }),
  };
}

export const base44 = {
  auth: {
    me: () => apiFetch('/api/me'),
    logout: async (callbackUrl) => {
      await signOut({ callbackUrl: callbackUrl || '/login' });
    },
    redirectToLogin: (callbackUrl) => {
      const cb = callbackUrl ? encodeURIComponent(callbackUrl) : encodeURIComponent('/Dashboard');
      window.location.href = `/login?callbackUrl=${cb}`;
    },
    updateMe: async () => true,
  },
  entities: {
    Category: makeEntity('categories'),
    Customer: makeEntity('customers'),
    Supplier: makeEntity('suppliers'),
    Income: makeEntity('incomes'),
    Expense: makeEntity('expenses'),
    CashBankMovement: makeEntity('cashbank'),
    Organization: makeEntity('organizations'),
    CustomDashboard: makeEntity('customdashboards'),
    FinancialReport: makeEntity('financialreports'),
  },
  integrations: {
    Core: {
      // Reemplaza el InvokeLLM de base44: pega contra /api/ai/invoke, que llama a Gemini server-side.
      InvokeLLM: async ({ prompt, response_json_schema } = {}) => {
        const result = await apiFetch('/api/ai/invoke', {
          method: 'POST',
          body: { prompt, response_json_schema },
        });
        return response_json_schema ? result : result.text;
      },
    },
  },
};
