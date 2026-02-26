import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Wallet } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import BulkUploadDialog from "../components/shared/BulkUploadDialog";
import { useOrganization } from "../components/shared/OrganizationContext";

const columns = [
  { key: "date", label: "Fecha", type: "date" },
  { key: "type", label: "Tipo", type: "badge", colorMap: {
    ingreso: "bg-emerald-100 text-emerald-700", egreso: "bg-red-100 text-red-700"
  }},
  { key: "account", label: "Cuenta", type: "badge", colorMap: {
    caja: "bg-amber-100 text-amber-700", banco_cuenta_corriente: "bg-blue-100 text-blue-700",
    banco_caja_ahorro: "bg-indigo-100 text-indigo-700", mercadopago: "bg-cyan-100 text-cyan-700",
    otra: "bg-slate-100 text-slate-700"
  }},
  { key: "category", label: "Categoría", type: "badge" },
  { key: "description", label: "Descripción" },
  { key: "amount", label: "Monto", type: "currency" },
  { key: "reference", label: "Referencia" },
];

const formFields = [
  { key: "date", label: "Fecha", type: "date", required: true },
  { key: "type", label: "Tipo", type: "select", required: true, options: [
    { value: "ingreso", label: "Ingreso" }, { value: "egreso", label: "Egreso" },
  ]},
  { key: "account", label: "Cuenta", type: "select", options: [
    { value: "caja", label: "Caja" }, { value: "banco_cuenta_corriente", label: "Banco Cuenta Corriente" },
    { value: "banco_caja_ahorro", label: "Banco Caja de Ahorro" },
    { value: "mercadopago", label: "MercadoPago" }, { value: "otra", label: "Otra" },
  ]},
  { key: "category", label: "Categoría", type: "select", options: [] },
  { key: "description", label: "Descripción", placeholder: "Ej: Depósito cliente" },
  { key: "amount", label: "Monto", type: "number", required: true, placeholder: "0.00" },
  { key: "currency", label: "Moneda", type: "select", default: "ARS", options: [
    { value: "ARS", label: "ARS" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
  ]},
  { key: "reference", label: "Referencia / N° Operación", placeholder: "Ej: OP-12345" },
  { key: "balance_after", label: "Saldo Posterior", type: "number", placeholder: "0.00" },
  { key: "notes", label: "Notas", type: "textarea", placeholder: "Notas adicionales..." },
];

const uploadFields = {
  date: { type: "string", description: "Fecha (YYYY-MM-DD)", required: true },
  type: { type: "string", description: "ingreso o egreso", required: true },
  amount: { type: "number", required: true },
  account: { type: "string" },
  category: { type: "string" },
  description: { type: "string" },
  currency: { type: "string" },
  reference: { type: "string" },
  balance_after: { type: "number" },
};

export default function CashBank() {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["movements", selectedOrgId],
    queryFn: () => base44.entities.CashBankMovement.filter({ organization_id: selectedOrgId }, "-date"),
    enabled: !!selectedOrgId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", selectedOrgId], 
    queryFn: () => base44.entities.Category.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });

  const movementCategories = categories.filter(c => c.type === "movimiento" && c.status === "activa");

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const dataWithOrg = { ...data, organization_id: selectedOrgId };
      return editing
        ? base44.entities.CashBankMovement.update(editing.id, dataWithOrg)
        : base44.entities.CashBankMovement.create(dataWithOrg);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movements", selectedOrgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => base44.entities.CashBankMovement.delete(row.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movements", selectedOrgId] }),
  });

  const totalIn = movements.filter(m => m.type === "ingreso").reduce((s, m) => s + (m.amount || 0), 0);
  const totalOut = movements.filter(m => m.type === "egreso").reduce((s, m) => s + (m.amount || 0), 0);
  const fmt = (v) => `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <PageHeader
        title="Caja y Bancos"
        subtitle="Movimientos de efectivo y cuentas bancarias"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Movimiento
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Ingresos" value={fmt(totalIn)} icon={Wallet} color="teal" />
        <StatCard title="Total Egresos" value={fmt(totalOut)} icon={Wallet} color="red" />
        <StatCard title="Saldo Neto" value={fmt(totalIn - totalOut)} icon={Wallet} color={totalIn - totalOut >= 0 ? "emerald" : "red"} />
      </div>

      <DataTable
        columns={columns}
        data={movements}
        isLoading={isLoading}
        onEdit={(row) => { setEditing(row); setFormOpen(true); }}
        onDelete={(row) => deleteMutation.mutate(row)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Movimiento"
        fields={formFields}
        record={editing}
        onSave={(data) => saveMutation.mutateAsync(data)}
        categoryType="movimiento"
        dynamicCategories={movementCategories}
      />

      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityName="CashBankMovement"
        fieldMapping={uploadFields}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["movements", selectedOrgId] });
          qc.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
        }}
        categoryType="movimiento"
        organizationId={selectedOrgId}
      />
    </div>
  );
}