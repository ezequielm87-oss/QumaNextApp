import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import RecordFormDialog from "../components/shared/RecordFormDialog";
import StatCard from "../components/shared/StatCard";
import { useOrganization } from "../components/shared/OrganizationContext";

const columns = [
  { key: "name", label: "Nombre" },
  { key: "type", label: "Tipo", type: "badge", colorMap: {
    ingreso: "bg-teal-100 text-teal-700",
    gasto: "bg-red-100 text-red-700",
    movimiento: "bg-blue-100 text-blue-700"
  }},
  { key: "description", label: "Descripción" },
  { key: "color", label: "Color", type: "badge" },
  { key: "status", label: "Estado", type: "badge", colorMap: {
    activa: "bg-emerald-100 text-emerald-700",
    inactiva: "bg-slate-100 text-slate-700"
  }},
];

const fields = [
  { key: "name", label: "Nombre", type: "text", placeholder: "Ej: Servicios Profesionales" },
  { key: "type", label: "Tipo", type: "select", options: [
    { value: "ingreso", label: "Ingreso" },
    { value: "gasto", label: "Gasto" },
    { value: "movimiento", label: "Movimiento de Caja/Banco" }
  ]},
  { key: "description", label: "Descripción", type: "textarea", placeholder: "Descripción de la categoría..." },
  { key: "color", label: "Color", type: "select", options: [
    { value: "teal", label: "Teal" }, { value: "blue", label: "Azul" }, { value: "violet", label: "Violeta" },
    { value: "amber", label: "Ámbar" }, { value: "pink", label: "Rosa" }, { value: "red", label: "Rojo" },
    { value: "indigo", label: "Índigo" }, { value: "cyan", label: "Cian" }, { value: "orange", label: "Naranja" },
    { value: "lime", label: "Lima" }, { value: "emerald", label: "Esmeralda" }, { value: "slate", label: "Gris" }
  ]},
  { key: "status", label: "Estado", type: "select", default: "activa", options: [
    { value: "activa", label: "Activa" },
    { value: "inactiva", label: "Inactiva" }
  ]},
];

export default function Categories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", selectedOrgId],
    queryFn: () => base44.entities.Category.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const dataWithOrg = { ...data, organization_id: selectedOrgId };
      return editingRecord?.id 
        ? base44.entities.Category.update(editingRecord.id, dataWithOrg)
        : base44.entities.Category.create(dataWithOrg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", selectedOrgId] });
      setFormOpen(false);
      setEditingRecord(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories", selectedOrgId] }),
  });





  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const activeCategories = categories.filter(c => c.status === "activa");
  const incomeCategories = activeCategories.filter(c => c.type === "ingreso");
  const expenseCategories = activeCategories.filter(c => c.type === "gasto");
  const movementCategories = activeCategories.filter(c => c.type === "movimiento");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxonomía de Categorías"
        subtitle="Gestiona las categorías para clasificar tus ingresos, gastos y movimientos"
        actions={
          <Button onClick={() => { setEditingRecord(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Categorías" value={categories.length} icon={Tag} color="teal" />
        <StatCard title="Ingresos" value={incomeCategories.length} icon={Tag} color="emerald" />
        <StatCard title="Gastos" value={expenseCategories.length} icon={Tag} color="red" />
        <StatCard title="Movimientos" value={movementCategories.length} icon={Tag} color="blue" />
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(record) => deleteMutation.mutate(record.id)}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingRecord ? "Editar Categoría" : "Nueva Categoría"}
        fields={fields}
        record={editingRecord}
        onSave={(data) => saveMutation.mutate(data)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}