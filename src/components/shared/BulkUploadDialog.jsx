import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkUploadDialog({ open, onOpenChange, entityName, fieldMapping, onSuccess, categoryType, organizationId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Extract data from file
      const prompt = `Extrae todos los registros del archivo adjunto y devuélvelos en formato JSON.
      
Estructura esperada:
${JSON.stringify(fieldMapping, null, 2)}

IMPORTANTE: 
- Si una columna tiene un nombre similar (ej: "fecha", "date", "dia"), mapeala al campo correcto
- Si hay columnas de categoría, mantén el nombre exacto como aparece
- Devuelve TODOS los registros, no solo ejemplos`;

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: fieldMapping
              }
            }
          }
        }
      });

      let records = extracted?.records || [];
      if (!Array.isArray(records)) {
        records = [];
      }

      if (records.length === 0) {
        setResult({ success: false, error: "No se encontraron registros en el archivo" });
        setLoading(false);
        return;
      }

      // If there's a category field and categoryType, handle auto-creation
      if (fieldMapping.category && categoryType && organizationId) {
        const existingCategories = await base44.entities.Category.filter({ organization_id: organizationId });
        const existingCategoryNames = new Set(
          existingCategories
            .filter(c => c.type === categoryType)
            .map(c => c.name.toLowerCase().trim())
        );

        const newCategoriesToCreate = new Set();
        records.forEach(record => {
          if (record.category) {
            const categoryName = String(record.category).trim();
            const categoryLower = categoryName.toLowerCase();
            if (!existingCategoryNames.has(categoryLower) && categoryName) {
              newCategoriesToCreate.add(categoryName);
            }
          }
        });

        for (const categoryName of newCategoriesToCreate) {
          await base44.entities.Category.create({
            name: categoryName,
            type: categoryType,
            status: "activa",
            color: "slate",
            organization_id: organizationId
          });
        }
      }

      // Add organization_id to all records
      const recordsWithOrg = records.map(r => ({ ...r, organization_id: organizationId }));

      // Insert records
      const entitySdk = base44.entities[entityName];
      if (!entitySdk) {
        throw new Error(`Entity ${entityName} not found`);
      }

      await entitySdk.bulkCreate(recordsWithOrg);

      setResult({ 
        success: true, 
        count: recordsWithOrg.length
      });
      onSuccess?.();
    } catch (error) {
      setResult({ success: false, error: error.message || "Error al procesar el archivo" });
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const headers = Object.keys(fieldMapping).join(",");
    const exampleRows = [];
    
    // Generate 3 example rows with realistic data
    for (let i = 1; i <= 3; i++) {
      const row = Object.keys(fieldMapping).map(key => {
        const field = fieldMapping[key];
        if (field.type === "number") return (10000 + (i * 5000)).toString();
        if (field.type === "string" && field.format === "date") return `2026-0${i}-${10 + i}`;
        if (field.enum && field.enum.length > 0) return field.enum[Math.min(i - 1, field.enum.length - 1)];
        if (key === "description") return `Descripción ejemplo ${i}`;
        if (key === "customer_name") return `Cliente ${i}`;
        if (key === "supplier_name") return `Proveedor ${i}`;
        if (key === "category") return `Categoria${i}`;
        if (key === "notes") return `Notas ${i}`;
        if (key === "reference") return `REF${1000 + i}`;
        return `valor_${i}`;
      }).join(",");
      exampleRows.push(row);
    }
    
    const csv = `${headers}\n${exampleRows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `template_${entityName.toLowerCase()}.csv`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              Carga Masiva - {entityName}
            </div>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Descargar Template
            </Button>
          </DialogTitle>
          <DialogDescription>
            Subí un archivo Excel (.xlsx, .csv) con tus registros. La IA mapeará automáticamente las columnas aunque tengan nombres diferentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!result ? (
            <>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-300">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600">
                  {file ? file.name : "Hacer clic para seleccionar archivo"}
                </span>
                <span className="text-xs text-slate-400 mt-1">Excel, CSV</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando con IA...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir y Procesar
                  </>
                )}
              </Button>
            </>
          ) : result.success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">¡Carga exitosa!</p>
              <p className="text-sm text-slate-500 mt-1">{result.count} registros importados</p>
              <Button onClick={handleClose} className="mt-4 bg-teal-600 hover:bg-teal-700">Cerrar</Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">Error en la carga</p>
              <p className="text-sm text-slate-500 mt-1">{result.error}</p>
              <Button onClick={() => setResult(null)} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}