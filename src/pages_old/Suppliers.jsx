import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Truck } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import BulkUploadDialog from "../components/shared/BulkUploadDialog";
import { useOrganization } from "../components/shared/OrganizationContext";

const columns = [
  { key: "name", label: "Nombre" },
  { key: "tax_id", label: "CUIT/CUIL" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "category", label: "Categoría", type: "badge", colorMap: {
    servicios: "bg-blue-100 text-blue-700", productos: "bg-teal-100 text-teal-700",
    logistica: "bg-orange-100 text-orange-700", tecnologia: "bg-violet-100 text-violet-700",
    infraestructura: "bg-amber-100 text-amber-700", otro: "bg-slate-100 text-slate-700"
  }},
  { key: "status", label: "Estado", type: "badge", colorMap: {
    activo: "bg-emerald-100 text-emerald-700", inactivo: "bg-red-100 text-red-700"
  }},
];

const formFields = [
  { key: "name", label: "Nombre / Razón Social", required: true, placeholder: "Ej: Proveedor S.R.L." },
  { key: "tax_id", label: "CUIT/CUIL", placeholder: "Ej: 30-12345678-9" },
  { key: "email", label: "Email", type: "email", placeholder: "email@ejemplo.com" },
  { key: "phone", label: "Teléfono", placeholder: "+54 11 1234-5678" },
  { key: "category", label: "Categoría", type: "select", options: [
    { value: "servicios", label: "Servicios" }, { value: "productos", label: "Productos" },
    { value: "logistica", label: "Logística" }, { value: "tecnologia", label: "Tecnología" },
    { value: "infraestructura", label: "Infraestructura" }, { value: "otro", label: "Otro" },
  ]},
  { key: "status", label: "Estado", type: "select", default: "activo", options: [
    { value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" },
  ]},
  { key: "notes", label: "Notas", type: "textarea", placeholder: "Notas adicionales..." },
];

const uploadFields = {
  name: { type: "string" },
  tax_id: { type: "string" },
  email: { type: "string" },
  phone: { type: "string" },
  category: { type: "string" },
  status: { type: "string" },
};

export default function Suppliers() {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", selectedOrgId],
    queryFn: () => base44.entities.Supplier.filter({ organization_id: selectedOrgId }, "-created_date"),
    enabled: !!selectedOrgId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const dataWithOrg = { ...data, organization_id: selectedOrgId };
      return editing
        ? base44.entities.Supplier.update(editing.id, dataWithOrg)
        : base44.entities.Supplier.create(dataWithOrg);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedOrgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => base44.entities.Supplier.delete(row.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedOrgId] }),
  });

  const active = suppliers.filter(s => s.status === "activo").length;

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Gestión de tu base de proveedores"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Proveedor
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Proveedores" value={suppliers.length} icon={Truck} color="violet" />
        <StatCard title="Activos" value={active} icon={Truck} color="emerald" />
        <StatCard title="Inactivos" value={suppliers.length - active} icon={Truck} color="red" />
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        onEdit={(row) => { setEditing(row); setFormOpen(true); }}
        onDelete={(row) => deleteMutation.mutate(row)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Proveedor"
        fields={formFields}
        record={editing}
        onSave={(data) => saveMutation.mutateAsync(data)}
      />

      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityName="Supplier"
        fieldMapping={uploadFields}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["suppliers", selectedOrgId] })}
        organizationId={selectedOrgId}
      />
    </div>
  );
}