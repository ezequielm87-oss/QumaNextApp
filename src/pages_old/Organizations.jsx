import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import StatCard from "../components/shared/StatCard";

const columns = [
  { key: "name", label: "Nombre" },
  { key: "tax_id", label: "CUIT" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "status", label: "Estado", type: "badge", colorMap: {
    activa: "bg-emerald-100 text-emerald-700",
    inactiva: "bg-slate-100 text-slate-700"
  }},
];

const fields = [
  { key: "name", label: "Nombre", type: "text", required: true, placeholder: "Ej: Mi Empresa SA" },
  { key: "tax_id", label: "CUIT", type: "text", placeholder: "XX-XXXXXXXX-X" },
  { key: "email", label: "Email", type: "email", placeholder: "contacto@empresa.com" },
  { key: "phone", label: "Teléfono", type: "text", placeholder: "+54 11 XXXX-XXXX" },
  { key: "address", label: "Dirección", type: "text", placeholder: "Calle 123, Ciudad" },
  { key: "status", label: "Estado", type: "select", default: "activa", options: [
    { value: "activa", label: "Activa" },
    { value: "inactiva", label: "Inactiva" }
  ]},
];

export default function Organizations() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => 
      editingRecord?.id 
        ? base44.entities.Organization.update(editingRecord.id, data)
        : base44.entities.Organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setFormOpen(false);
      setEditingRecord(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Organization.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const activeOrgs = organizations.filter(o => o.status === "activa");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizaciones"
        subtitle="Gestiona las empresas en el sistema multi-tenant"
        actions={
          <Button onClick={() => { setEditingRecord(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Organización
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Organizaciones" value={organizations.length} icon={Building2} color="teal" />
        <StatCard title="Activas" value={activeOrgs.length} icon={Building2} color="emerald" />
      </div>

      <DataTable
        columns={columns}
        data={organizations}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(record) => deleteMutation.mutate(record.id)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingRecord ? "Editar Organización" : "Nueva Organización"}
        fields={fields}
        record={editingRecord}
        onSave={(data) => saveMutation.mutate(data)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}