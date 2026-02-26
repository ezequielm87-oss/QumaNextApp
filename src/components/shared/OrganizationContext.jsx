'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const OrganizationContext = createContext();

export function OrganizationProvider({ children }) {
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!mounted) return;
        setUser(me);
        setSelectedOrgId(me.organization_id);
      } catch {
        if (!mounted) return;
        setUser(null);
        setSelectedOrgId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <OrganizationContext.Provider value={{ selectedOrgId, user, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}
