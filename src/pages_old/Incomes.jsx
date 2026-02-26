import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, TrendingUp } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import BulkUploadDialog from "../components/shared/BulkUploadDialog";
import { useOrganization } from "../components/shared/OrganizationContext";

const columns = [
  { key: "date", label: "Fecha", type: "date" },
  { key: "description", label: "Descripción" },
  { key: "customer_name", label: "Cliente" },
  { key: "category", label: "Categoría", type: "badge", colorMap: {
    venta_producto: "bg-teal-100 text-teal-700", venta_servicio: "bg-blue-100 text-blue-700",
    honorarios: "bg-violet-100 text-violet-700", comisiones: "bg-amber-100 text-amber-700",
    alquiler: "bg-pink-100 text-pink-700", intereses: "bg-indigo-100 text-indigo-700", otro: "bg-slate-100 text-slate-700"
  }},
  { key: "amount", label: "Monto", type: "currency" },
  { key: "status", label: "Estado", type: "badge", colorMap: {
    cobrado: "bg-emerald-100 text-emerald-700", pendiente: "bg-amber-100 text-amber-700", vencido: "bg-red-100 text-red-700"
  }},
  { key: "estimated_date", label: "Fecha Estimada", type: "date" },
];

const formFields = [
  { key: "date", label: "Fecha", type: "date", required: true },
  { key: "description", label: "Descripción", placeholder: "Ej: Venta de producto X" },
  { key: "customer_name", label: "Cliente", placeholder: "Nombre del cliente" },
  { key: "category", label: "Categoría", type: "select", options: [
    { value: "venta_producto", label: "Venta Producto" }, { value: "venta_servicio", label: "Venta Servicio" },
    { value: "honorarios", label: "Honorarios" }, { value: "comisiones", label: "Comisiones" },
    { value: "alquiler", label: "Alquiler" }, { value: "intereses", label: "Intereses" }, { value: "otro", label: "Otro" },
  ]},
  { key: "amount", label: "Monto", type: "number", required: true, placeholder: "0.00" },
  { key: "currency", label: "Moneda", type: "select", default: "ARS", options: [
    { value: "ARS", label: "ARS" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
  ]},
  { key: "payment_method", label: "Medio de Pago", type: "select", options: [
    { value: "efectivo", label: "Efectivo" }, { value: "transferencia", label: "Transferencia" },
    { value: "cheque", label: "Cheque" }, { value: "tarjeta", label: "Tarjeta" }, { value: "otro", label: "Otro" },
  ]},
  { key: "invoice_number", label: "N° Factura", placeholder: "Ej: FC-0001" },
  { key: "status", label: "Estado", type: "select", default: "cobrado", options: [
    { value: "cobrado", label: "Cobrado" }, { value: "pendiente", label: "Pendiente" }, { value: "vencido", label: "Vencido" },
  ]},
  { key: "estimated_date", label: "Fecha Estimada de Cobro", type: "date", placeholder: "Solo para pendientes", conditional: { field: "status", values: ["pendiente", "vencido"] } },
  { key: "notes", label: "Notas", type: "textarea", placeholder: "Notas adicionales..." },
];

const uploadFields = {
  date: { type: "string", description: "Fecha (YYYY-MM-DD)", required: true },
  amount: { type: "number", required: true },
  description: { type: "string" },
  customer_name: { type: "string" },
  category: { type: "string" },
  currency: { type: "string" },
  payment_method: { type: "string" },
  invoice_number: { type: "string" },
  status: { type: "string" },
};

export default function Incomes() {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: incomes = [], isLoading } = useQuery({
    queryKey: ["incomes", selectedOrgId],
    queryFn: () => base44.entities.Income.filter({ organization_id: selectedOrgId }, "-date"),
    enabled: !!selectedOrgId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", selectedOrgId], 
    queryFn: () => base44.entities.Category.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });

  const incomeCategories = categories.filter(c => c.type === "ingreso" && c.status === "activa");

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const dataWithOrg = { ...data, organization_id: selectedOrgId };
      return editing
        ? base44.entities.Income.update(editing.id, dataWithOrg)
        : base44.entities.Income.create(dataWithOrg);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incomes", selectedOrgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => base44.entities.Income.delete(row.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incomes", selectedOrgId] }),
  });

  const total = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const pending = incomes.filter(i => i.status === "pendiente").reduce((s, i) => s + (i.amount || 0), 0);
  const fmt = (v) => `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <PageHeader
        title="Ingresos / Ventas"
        subtitle="Gestión de todas tus ventas e ingresos"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Ingreso
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Ingresos" value={fmt(total)} icon={TrendingUp} color="teal" />
        <StatCard title="Pendientes de Cobro" value={fmt(pending)} icon={TrendingUp} color="amber" />
        <StatCard title="Registros" value={incomes.length} icon={TrendingUp} color="blue" />
      </div>

      <DataTable
        columns={columns}
        data={incomes}
        isLoading={isLoading}
        onEdit={(row) => { setEditing(row); setFormOpen(true); }}
        onDelete={(row) => deleteMutation.mutate(row)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Ingreso"
        fields={formFields}
        record={editing}
        onSave={(data) => saveMutation.mutateAsync(data)}
        categoryType="ingreso"
        dynamicCategories={incomeCategories}
      />

      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityName="Income"
        fieldMapping={uploadFields}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["incomes", selectedOrgId] });
          qc.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
        }}
        categoryType="ingreso"
        organizationId={selectedOrgId}
      />
    </div>
  );
}