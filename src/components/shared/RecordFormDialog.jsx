import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function RecordFormDialog({ open, onOpenChange, title, fields, record, onSave, categoryType, dynamicCategories }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      const initial = {};
      fields.forEach(f => {
        initial[f.key] = record?.[f.key] || f.default || "";
      });
      setFormData(initial);
    }
  }, [open, record, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setShowNewCategory(false);
    setNewCategoryName("");
    onOpenChange(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !categoryType) return;
    
    setSaving(true);
    try {
      const orgId = formData.organization_id;
      const newCategory = await base44.entities.Category.create({
        name: newCategoryName.trim(),
        type: categoryType,
        status: "activa",
        color: "slate",
        organization_id: orgId
      });
      
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData({ ...formData, category: newCategory.name });
      setShowNewCategory(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error creating category:", error);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record ? "Editar" : "Nuevo"} {title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((f) => {
            // Check conditional rendering
            if (f.conditional) {
              const conditionField = formData[f.conditional.field];
              if (!f.conditional.values.includes(conditionField)) {
                return null;
              }
            }
            
            // Handle dynamic categories
            if (f.key === "category" && dynamicCategories) {
              return (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">{f.label}</Label>
                  {!showNewCategory ? (
                    <>
                      <Select
                        value={formData[f.key] || ""}
                        onValueChange={(v) => {
                          if (v === "__new__") {
                            setShowNewCategory(true);
                          } else {
                            setFormData({ ...formData, [f.key]: v });
                          }
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                        <SelectContent>
                          {dynamicCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                          <SelectItem value="__new__" className="text-teal-600 font-medium">
                            <Plus className="w-3 h-3 inline mr-1" /> Crear nueva categoría
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de nueva categoría"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={handleCreateCategory} disabled={!newCategoryName.trim() || saving}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}>
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">{f.label}</Label>
              {f.type === "select" ? (
                <Select
                  value={formData[f.key] || ""}
                  onValueChange={(v) => setFormData({ ...formData, [f.key]: v })}
                >
                  <SelectTrigger><SelectValue placeholder={`Seleccionar ${f.label.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  value={formData[f.key] || ""}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  value={formData[f.key] || ""}
                  onChange={(e) => setFormData({ ...formData, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </div>
            );
          })}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}