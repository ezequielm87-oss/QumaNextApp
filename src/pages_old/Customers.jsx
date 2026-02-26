import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Users } from "lucide-react";
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
    mayorista: "bg-blue-100 text-blue-700", minorista: "bg-teal-100 text-teal-700",
    corporativo: "bg-violet-100 text-violet-700", gobierno: "bg-amber-100 text-amber-700",
    otro: "bg-slate-100 text-slate-700"
  }},
  { key: "status", label: "Estado", type: "badge", colorMap: {
    activo: "bg-emerald-100 text-emerald-700", inactivo: "bg-red-100 text-red-700"
  }},
];

const formFields = [
  { key: "name", label: "Nombre / Razón Social", required: true, placeholder: "Ej: Empresa S.A." },
  { key: "tax_id", label: "CUIT/CUIL/DNI", placeholder: "Ej: 20-12345678-9" },
  { key: "email", label: "Email", type: "email", placeholder: "email@ejemplo.com" },
  { key: "phone", label: "Teléfono", placeholder: "+54 11 1234-5678" },
  { key: "category", label: "Categoría", type: "select", options: [
    { value: "mayorista", label: "Mayorista" }, { value: "minorista", label: "Minorista" },
    { value: "corporativo", label: "Corporativo" }, { value: "gobierno", label: "Gobierno" },
    { value: "otro", label: "Otro" },
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

export default function Customers() {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"], queryFn: () => base44.entities.Customer.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Customer.update(editing.id, data)
      : base44.entities.Customer.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => base44.entities.Customer.delete(row.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const active = customers.filter(c => c.status === "activo").length;

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Gestión de tu cartera de clientes"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Clientes" value={customers.length} icon={Users} color="blue" />
        <StatCard title="Activos" value={active} icon={Users} color="emerald" />
        <StatCard title="Inactivos" value={customers.length - active} icon={Users} color="red" />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        onEdit={(row) => { setEditing(row); setFormOpen(true); }}
        onDelete={(row) => deleteMutation.mutate(row)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Cliente"
        fields={formFields}
        record={editing}
        onSave={(data) => saveMutation.mutateAsync(data)}
      />

      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entityName="Clientes"
        entityClass={base44.entities.Customer}
        fieldMapping={uploadFields}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["customers"] })}
      />
    </div>
  );
}