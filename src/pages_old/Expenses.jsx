import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, TrendingDown } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import BulkUploadDialog from "../components/shared/BulkUploadDialog";
import { useOrganization } from "../components/shared/OrganizationContext";

const columns = [
  { key: "date", label: "Fecha", type: "date" },
  { key: "description", label: "Descripción" },
  { key: "supplier_name", label: "Proveedor" },
  { key: "category", label: "Categoría", type: "badge", colorMap: {
    alquiler: "bg-pink-100 text-pink-700", servicios: "bg-blue-100 text-blue-700",
    sueldos: "bg-violet-100 text-violet-700", impuestos: "bg-red-100 text-red-700",
    insumos: "bg-amber-100 text-amber-700", marketing: "bg-indigo-100 text-indigo-700",
    tecnologia: "bg-cyan-100 text-cyan-700", logistica: "bg-orange-100 text-orange-700",
    mantenimiento: "bg-lime-100 text-lime-700", financiero: "bg-rose-100 text-rose-700",
    otro: "bg-slate-100 text-slate-700"
  }},
  { key: "amount", label: "Monto", type: "currency" },
  { key: "status", label: "Estado", type: "badge", colorMap: {
    pagado: "bg-emerald-100 text-emerald-700", pendiente: "bg-amber-100 text-amber-700", vencido: "bg-red-100 text-red-700"
  }},
  { key: "estimated_date", label: "Fecha Estimada", type: "date" },
];

const formFields = [
  { key: "date", label: "Fecha", type: "date", required: true },
  { key: "description", label: "Descripción", placeholder: "Ej: Alquiler oficina" },
  { key: "supplier_name", label: "Proveedor", placeholder: "Nombre del proveedor" },
  { key: "category", label: "Categoría", type: "select", options: [
    { value: "alquiler", label: "Alquiler" }, { value: "servicios", label: "Servicios" },
    { value: "sueldos", label: "Sueldos" }, { value: "impuestos", label: "Impuestos" },
    { value: "insumos", label: "Insumos" }, { value: "marketing", label: "Marketing" },
    { value: "tecnologia", label: "Tecnología" }, { value: "logistica", label: "Logística" },
    { value: "mantenimiento", label: "Mantenimiento" }, { value: "financiero", label: "Financiero" },
    { value: "otro", label: "Otro" },
  ]},
  { key: "amount", label: "Monto", type: "number", required: true, placeholder: "0.00" },
  { key: "currency", label: "Moneda", type: "select", default: "ARS", options: [
    { value: "ARS", label: "ARS" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
  ]},
  { key: "payment_method", label: "Medio de Pago", type: "select", options: [
    { value: "efectivo", label: "Efectivo" }, { value: "transferencia", label: "Transferencia" },
    { value: "cheque", label: "Cheque" }, { value: "tarjeta", label: "Tarjeta" }, { value: "otro", label: "Otro" },
  ]},
  { key: "invoice_number", label: "N° Comprobante", placeholder: "Ej: FC-0001" },
  { key: "status", label: "Estado", type: "select", default: "pagado", options: [
    { value: "pagado", label: "Pagado" }, { value: "pendiente", label: "Pendiente" }, { value: "vencido", label: "Vencido" },
  ]},
  { key: "estimated_date", label: "Fecha Estimada de Pago", type: "date", placeholder: "Solo para pendientes", conditional: { field: "status", values: ["pendiente", "vencido"] } },
  { key: "notes", label: "Notas", type: "textarea", placeholder: "Notas adicionales..." },
];

const uploadFields = {
  date: { type: "string", description: "Fecha (YYYY-MM-DD)", required: true },
  amount: { type: "number", required: true },
  description: { type: "string" },
  supplier_name: { type: "string" },
  category: { type: "string" },
  currency: { type: "string" },
  payment_method: { type: "string" },
  invoice_number: { type: "string" },
  status: { type: "string" },
};

export default function Expenses() {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", selectedOrgId],
    queryFn: () => base44.entities.Expense.filter({ organization_id: selectedOrgId }, "-date"),
    enabled: !!selectedOrgId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", selectedOrgId], 
    queryFn: () => base44.entities.Category.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });

  const expenseCategories = categories.filter(c => c.type === "gasto" && c.status === "activa");

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const dataWithOrg = { ...data, organization_id: selectedOrgId };
      return editing
        ? base44.entities.Expense.update(editing.id, dataWithOrg)
        : base44.entities.Expense.create(dataWithOrg);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", selectedOrgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => base44.entities.Expense.delete(row.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", selectedOrgId] }),
  });

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === "pendiente").reduce((s, e) => s + (e.amount || 0), 0);
  const fmt = (v) => `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <PageHeader
        title="Gastos / Egresos"
        subtitle="Gestión de todos tus gastos y egresos"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Gasto
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Gastos" value={fmt(total)} icon={TrendingDown} color="red" />
        <StatCard title="Pendientes de Pago" value={fmt(pending)} icon={TrendingDown} color="amber" />
        <StatCard title="Registros" value={expenses.length} icon={TrendingDown} color="blue" />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        onEdit={(row) => { setEditing(row); setFormOpen(true); }}
        onDelete={(row) => deleteMutation.mutate(row)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Gasto"
        fields={formFields}
        record={editing}
        onSave={(data) => saveMutation.mutateAsync(data)}
        categoryType="gasto"
        dynamicCategories={expenseCategories}
      />

      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityName="Expense"
        fieldMapping={uploadFields}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["expenses", selectedOrgId] });
          qc.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
        }}
        categoryType="gasto"
        organizationId={selectedOrgId}
      />
    </div>
  );
}