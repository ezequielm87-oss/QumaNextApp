import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Plus, Trash2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend } from "recharts";
import PageHeader from "../components/shared/PageHeader";
import { useOrganization } from "../components/shared/OrganizationContext";

const COLORS = ["#0d9488", "#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function AIChart({ config }) {
  if (!config) return null;
  const { type, data, title, dataKey, nameKey, xKey } = config;

  return (
    <Card className="p-5 bg-white border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-700 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        {type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={xKey || "name"} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip />
            <Bar dataKey={dataKey || "value"} fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={xKey || "name"} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey || "value"} stroke="#0d9488" strokeWidth={2} dot={{ fill: "#0d9488" }} />
          </LineChart>
        ) : type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={xKey || "name"} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey || "value"} stroke="#0d9488" fill="#0d948820" strokeWidth={2} />
          </AreaChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey={dataKey || "value"} nameKey={nameKey || "name"} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
              {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : null}
      </ResponsiveContainer>
    </Card>
  );
}

export default function AIDashboard() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
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
  const { data: dashboards = [] } = useQuery({ 
    queryKey: ["custom-dashboards", selectedOrgId], 
    queryFn: () => base44.entities.CustomDashboard.filter({ organization_id: selectedOrgId }, "-created_date"),
    enabled: !!selectedOrgId,
  });

  const generateDashboard = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    const summaryData = {
      total_ingresos: incomes.reduce((s, i) => s + (i.amount || 0), 0),
      total_gastos: expenses.reduce((s, e) => s + (e.amount || 0), 0),
      ingresos_por_categoria: {},
      gastos_por_categoria: {},
      ingresos_por_mes: {},
      gastos_por_mes: {},
      top_clientes: {},
      movimientos_por_cuenta: {},
    };

    incomes.forEach(i => {
      summaryData.ingresos_por_categoria[i.category || "otro"] = (summaryData.ingresos_por_categoria[i.category || "otro"] || 0) + (i.amount || 0);
      const m = i.date?.substring(0, 7) || "sin_fecha";
      summaryData.ingresos_por_mes[m] = (summaryData.ingresos_por_mes[m] || 0) + (i.amount || 0);
      if (i.customer_name) summaryData.top_clientes[i.customer_name] = (summaryData.top_clientes[i.customer_name] || 0) + (i.amount || 0);
    });

    expenses.forEach(e => {
      summaryData.gastos_por_categoria[e.category || "otro"] = (summaryData.gastos_por_categoria[e.category || "otro"] || 0) + (e.amount || 0);
      const m = e.date?.substring(0, 7) || "sin_fecha";
      summaryData.gastos_por_mes[m] = (summaryData.gastos_por_mes[m] || 0) + (e.amount || 0);
    });

    movements.forEach(m => {
      summaryData.movimientos_por_cuenta[m.account || "otra"] = (summaryData.movimientos_por_cuenta[m.account || "otra"] || 0) + (m.amount || 0);
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Sos un experto financiero y analista de datos. El usuario quiere un dashboard personalizado con estos datos financieros:

DATOS FINANCIEROS:
${JSON.stringify(summaryData, null, 2)}

SOLICITUD DEL USUARIO: "${prompt}"

Generá un dashboard con entre 2 y 4 gráficos relevantes. Cada gráfico debe tener datos reales basados en la información provista.
IMPORTANTE: Los tipos de gráfico válidos son: "bar", "line", "area", "pie".
Los datos deben ser arrays de objetos con "name" y "value" como keys principales.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          charts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                data: { type: "array", items: { type: "object", properties: { name: { type: "string" }, value: { type: "number" } } } },
                dataKey: { type: "string" },
                nameKey: { type: "string" },
                xKey: { type: "string" },
              }
            }
          }
        }
      }
    });

    await base44.entities.CustomDashboard.create({
      title: result.title || "Dashboard Personalizado",
      description: result.description || "",
      charts_config: JSON.stringify(result.charts || []),
      prompt_used: prompt,
      organization_id: selectedOrgId,
    });

    qc.invalidateQueries({ queryKey: ["custom-dashboards", selectedOrgId] });
    setPrompt("");
    setGenerating(false);
  };

  const deleteDashboard = async (id) => {
    await base44.entities.CustomDashboard.delete(id);
    qc.invalidateQueries({ queryKey: ["custom-dashboards", selectedOrgId] });
  };

  return (
    <div>
      <PageHeader title="Dashboard IA" subtitle="Generá dashboards personalizados con inteligencia artificial" />

      {/* Generator */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold">Generador de Dashboards con IA</h3>
            <p className="text-sm text-slate-400 mt-1">Describí qué querés visualizar y la IA creará los gráficos</p>
          </div>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Quiero ver la evolución mensual de ingresos vs gastos, los gastos por categoría en un pie chart, y el top de clientes por facturación..."
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mb-4"
          rows={3}
        />
        <Button
          onClick={generateDashboard}
          disabled={generating || !prompt.trim()}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando Dashboard...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Dashboard
            </>
          )}
        </Button>
      </Card>

      {/* Saved dashboards */}
      {dashboards.length === 0 && (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Aún no generaste dashboards personalizados</p>
          <p className="text-slate-400 text-xs mt-1">Usá el generador de arriba para crear tu primer dashboard</p>
        </div>
      )}

      {dashboards.map((db) => {
        let charts = [];
        try { charts = JSON.parse(db.charts_config || "[]"); } catch { charts = []; }

        return (
          <div key={db.id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{db.title}</h3>
                {db.description && <p className="text-sm text-slate-500 mt-0.5">{db.description}</p>}
                <p className="text-xs text-slate-400 mt-1">Prompt: "{db.prompt_used}"</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteDashboard(db.id)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {charts.map((chart, idx) => (
                <AIChart key={idx} config={chart} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}