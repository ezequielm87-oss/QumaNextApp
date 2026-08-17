import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Sparkles, Loader2, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import PageHeader from "../components/shared/PageHeader";
import { useOrganization } from "../components/shared/OrganizationContext";

export default function AIReports() {
  const [reportType, setReportType] = useState("general");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const qc = useQueryClient();
  const { selectedOrgId } = useOrganization();

  const { data: incomes = [] } = useQuery({ 
    queryKey: ["incomes", selectedOrgId], 
    queryFn: () => base44.entities.Income.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: expenses = [] } = useQuery({ 
    queryKey: ["expenses", selectedOrgId], 
    queryFn: () => base44.entities.Expense.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: movements = [] } = useQuery({ 
    queryKey: ["movements", selectedOrgId], 
    queryFn: () => base44.entities.CashBankMovement.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: customers = [] } = useQuery({ 
    queryKey: ["customers", selectedOrgId], 
    queryFn: () => base44.entities.Customer.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: suppliers = [] } = useQuery({ 
    queryKey: ["suppliers", selectedOrgId], 
    queryFn: () => base44.entities.Supplier.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: reports = [] } = useQuery({ 
    queryKey: ["reports", selectedOrgId], 
    queryFn: () => base44.entities.FinancialReport.filter({ organization_id: selectedOrgId }, "-created_date"),
    enabled: !!selectedOrgId,
  });

  const typeLabels = {
    general: "Reporte General",
    rentabilidad: "Análisis de Rentabilidad",
    flujo_caja: "Flujo de Caja",
    proyeccion: "Proyección Financiera",
    clientes: "Análisis de Clientes",
    proveedores: "Análisis de Proveedores",
    personalizado: "Reporte Personalizado",
  };

  const generateReport = async () => {
    setGenerating(true);
    setError(null);

    const filteredIncomes = incomes.filter(i => {
      if (periodFrom && i.date < periodFrom) return false;
      if (periodTo && i.date > periodTo) return false;
      return true;
    });
    const filteredExpenses = expenses.filter(e => {
      if (periodFrom && e.date < periodFrom) return false;
      if (periodTo && e.date > periodTo) return false;
      return true;
    });

    const dataContext = {
      periodo: { desde: periodFrom || "inicio", hasta: periodTo || "actualidad" },
      resumen: {
        total_ingresos: filteredIncomes.reduce((s, i) => s + (i.amount || 0), 0),
        total_gastos: filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0),
        cantidad_ingresos: filteredIncomes.length,
        cantidad_gastos: filteredExpenses.length,
        total_clientes: customers.length,
        total_proveedores: suppliers.length,
      },
      ingresos_por_categoria: {},
      gastos_por_categoria: {},
      ingresos_por_cliente: {},
      gastos_por_proveedor: {},
      ingresos_por_estado: {},
      gastos_por_estado: {},
    };

    filteredIncomes.forEach(i => {
      dataContext.ingresos_por_categoria[i.category || "otro"] = (dataContext.ingresos_por_categoria[i.category || "otro"] || 0) + (i.amount || 0);
      if (i.customer_name) dataContext.ingresos_por_cliente[i.customer_name] = (dataContext.ingresos_por_cliente[i.customer_name] || 0) + (i.amount || 0);
      dataContext.ingresos_por_estado[i.status || "cobrado"] = (dataContext.ingresos_por_estado[i.status || "cobrado"] || 0) + (i.amount || 0);
    });
    filteredExpenses.forEach(e => {
      dataContext.gastos_por_categoria[e.category || "otro"] = (dataContext.gastos_por_categoria[e.category || "otro"] || 0) + (e.amount || 0);
      if (e.supplier_name) dataContext.gastos_por_proveedor[e.supplier_name] = (dataContext.gastos_por_proveedor[e.supplier_name] || 0) + (e.amount || 0);
      dataContext.gastos_por_estado[e.status || "pagado"] = (dataContext.gastos_por_estado[e.status || "pagado"] || 0) + (e.amount || 0);
    });

    const typePrompts = {
      general: "Generá un reporte financiero general completo con resumen ejecutivo, análisis de ingresos, análisis de gastos, resultado neto, y recomendaciones.",
      rentabilidad: "Generá un análisis de rentabilidad detallado con márgenes por categoría, análisis de contribución, y recomendaciones para mejorar la rentabilidad.",
      flujo_caja: "Generá un análisis de flujo de caja con análisis de cobros, pagos pendientes, proyección de flujo, y recomendaciones de gestión de liquidez.",
      proyeccion: "Generá una proyección financiera a 3 y 6 meses basada en las tendencias actuales, con escenarios optimista, base y pesimista.",
      clientes: "Generá un análisis de clientes con ranking por facturación, análisis de concentración, clientes en riesgo, y recomendaciones comerciales.",
      proveedores: "Generá un análisis de proveedores con ranking por gasto, análisis de concentración, optimización de costos, y recomendaciones de negociación.",
      personalizado: customPrompt || "Generá un reporte financiero personalizado.",
    };

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un director financiero (CFO) experto de QUMA Finance, una boutique de finanzas estratégicas para PyMEs.

Generá un reporte financiero profesional en formato markdown con la siguiente información:

TIPO DE REPORTE: ${typeLabels[reportType]}
INSTRUCCIÓN: ${typePrompts[reportType]}

DATOS FINANCIEROS REALES DEL CLIENTE:
${JSON.stringify(dataContext, null, 2)}

El reporte debe incluir:
- Título y fecha
- Resumen ejecutivo
- Análisis detallado con datos reales
- KPIs clave
- Conclusiones y recomendaciones estratégicas accionables
- Usar formato profesional con headers, bullet points, tablas en markdown
- Montos en formato $XX.XXX,XX (pesos argentinos)
- Tono profesional pero accesible para un emprendedor/PyME`,
      });

      await base44.entities.FinancialReport.create({
        title: `${typeLabels[reportType]} - ${periodFrom ? format(new Date(periodFrom), "dd/MM/yyyy") : "Inicio"} a ${periodTo ? format(new Date(periodTo), "dd/MM/yyyy") : "Hoy"}`,
        type: reportType,
        period_from: periodFrom || undefined,
        period_to: periodTo || undefined,
        content: result,
        prompt_used: typePrompts[reportType],
        organization_id: selectedOrgId,
      });

      qc.invalidateQueries({ queryKey: ["reports", selectedOrgId] });
    } catch (err) {
      setError(err?.data?.error || err?.message || "No se pudo generar el reporte.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id) => {
    await base44.entities.FinancialReport.delete(id);
    qc.invalidateQueries({ queryKey: ["reports", selectedOrgId] });
  };

  return (
    <div>
      <PageHeader title="Reportes Financieros IA" subtitle="Generá reportes inteligentes con análisis y recomendaciones" />

      {/* Generator */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold">Generador de Reportes Inteligentes</h3>
            <p className="text-sm text-slate-400 mt-1">La IA analiza tus datos y genera reportes profesionales con recomendaciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Período Desde</Label>
            <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)}
              className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Período Hasta</Label>
            <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)}
              className="bg-white/10 border-white/20 text-white" />
          </div>
        </div>

        {reportType === "personalizado" && (
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describí qué tipo de análisis necesitás..."
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mb-4"
            rows={3}
          />
        )}

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <Button
          onClick={generateReport}
          disabled={generating}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando Reporte...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generar Reporte
            </>
          )}
        </Button>
      </Card>

      {/* Saved reports */}
      {reports.length === 0 && (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Aún no generaste reportes</p>
        </div>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="bg-white border border-slate-200 overflow-hidden">
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{report.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {report.created_date ? format(new Date(report.created_date), "dd/MM/yyyy HH:mm") : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
                {expandedId === report.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === report.id && (
              <div className="px-5 pb-5 border-t border-slate-100">
                <div className="prose prose-sm prose-slate max-w-none mt-4">
                  <ReactMarkdown>{report.content || "Sin contenido"}</ReactMarkdown>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}