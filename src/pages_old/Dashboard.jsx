import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet, Users, Truck, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import { useOrganization } from "../components/shared/OrganizationContext";

const COLORS = ["#0d9488", "#14b8a6", "#5eead4", "#2dd4bf", "#99f6e4", "#6366f1", "#818cf8", "#a78bfa"];

export default function Dashboard() {
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { selectedOrgId } = useOrganization();

  const { data: allIncomes = [] } = useQuery({ 
    queryKey: ["incomes", selectedOrgId], 
    queryFn: () => base44.entities.Income.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: allExpenses = [] } = useQuery({ 
    queryKey: ["expenses", selectedOrgId], 
    queryFn: () => base44.entities.Expense.filter({ organization_id: selectedOrgId }),
    enabled: !!selectedOrgId,
  });
  const { data: allMovements = [] } = useQuery({ 
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

  // Filter data by period
  const getDateFilter = () => {
    const now = new Date();
    if (periodFilter === "7d") return format(subDays(now, 7), "yyyy-MM-dd");
    if (periodFilter === "3m") return format(subMonths(now, 3), "yyyy-MM-dd");
    if (periodFilter === "6m") return format(subMonths(now, 6), "yyyy-MM-dd");
    if (periodFilter === "1y") return format(subMonths(now, 12), "yyyy-MM-dd");
    if (periodFilter === "custom") return customFrom;
    return null;
  };

  const dateFrom = getDateFilter();
  const dateTo = periodFilter === "custom" ? customTo : null;

  const filterByDate = (records) => {
    return records.filter(r => {
      if (!r.date) return true;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  };

  const incomes = filterByDate(allIncomes);
  const expenses = filterByDate(allExpenses);
  const movements = filterByDate(allMovements);

  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netResult = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? ((netResult / totalIncome) * 100).toFixed(1) : 0;

  const pendingIncome = incomes.filter(i => i.status === "pendiente").reduce((s, i) => s + (i.amount || 0), 0);
  const pendingExpense = expenses.filter(e => e.status === "pendiente").reduce((s, e) => s + (e.amount || 0), 0);

  // Monthly data for last 6 months
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = format(startOfMonth(d), "yyyy-MM-dd");
      const end = format(endOfMonth(d), "yyyy-MM-dd");
      const monthInc = incomes.filter(r => r.date >= start && r.date <= end).reduce((s, r) => s + (r.amount || 0), 0);
      const monthExp = expenses.filter(r => r.date >= start && r.date <= end).reduce((s, r) => s + (r.amount || 0), 0);
      months.push({
        month: format(d, "MMM", { locale: es }),
        ingresos: monthInc,
        gastos: monthExp,
        resultado: monthInc - monthExp,
      });
    }
    return months;
  };

  const getExpenseByCategory = () => {
    const cats = {};
    expenses.forEach(e => {
      const cat = e.category || "otro";
      cats[cat] = (cats[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  };

  const getIncomeByCategory = () => {
    const cats = {};
    incomes.forEach(i => {
      const cat = i.category || "otro";
      cats[cat] = (cats[cat] || 0) + (i.amount || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  };

  const getTopClients = () => {
    const clients = {};
    incomes.forEach(i => {
      if (i.customer_name) clients[i.customer_name] = (clients[i.customer_name] || 0) + (i.amount || 0);
    });
    return Object.entries(clients).sort(([,a],[,b]) => b - a).slice(0, 5).map(([name, total]) => ({ name, total }));
  };

  const monthlyData = getMonthlyData();
  const expenseByCat = getExpenseByCategory();
  const incomeByCat = getIncomeByCategory();
  const topClients = getTopClients();

  const formatCurrency = (v) => `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

  const getPeriodLabel = () => {
    if (periodFilter === "all") return "Todo el período";
    if (periodFilter === "7d") return "Últimos 7 días";
    if (periodFilter === "3m") return "Últimos 3 meses";
    if (periodFilter === "6m") return "Últimos 6 meses";
    if (periodFilter === "1y") return "Último año";
    if (periodFilter === "custom" && customFrom) {
      return `${format(new Date(customFrom), "dd/MM/yy")}${customTo ? ` - ${format(new Date(customTo), "dd/MM/yy")}` : ""}`;
    }
    return "Período personalizado";
  };

  return (
    <div>
      <PageHeader 
        title="Dashboard Financiero" 
        subtitle="Visión integral de tu negocio"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={periodFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodFilter("all")}
              className={periodFilter === "all" ? "bg-teal-600" : ""}
            >
              Todo
            </Button>
            <Button
              variant={periodFilter === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodFilter("7d")}
              className={periodFilter === "7d" ? "bg-teal-600" : ""}
            >
              7 días
            </Button>
            <Button
              variant={periodFilter === "3m" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodFilter("3m")}
              className={periodFilter === "3m" ? "bg-teal-600" : ""}
            >
              3 meses
            </Button>
            <Button
              variant={periodFilter === "6m" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodFilter("6m")}
              className={periodFilter === "6m" ? "bg-teal-600" : ""}
            >
              6 meses
            </Button>
            <Button
              variant={periodFilter === "1y" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodFilter("1y")}
              className={periodFilter === "1y" ? "bg-teal-600" : ""}
            >
              1 año
            </Button>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={periodFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  className={periodFilter === "custom" ? "bg-teal-600" : ""}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {periodFilter === "custom" && customFrom ? getPeriodLabel() : "Personalizado"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Período Personalizado</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Desde</Label>
                    <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Hasta</Label>
                    <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </div>
                  <Button 
                    onClick={() => { setPeriodFilter("custom"); setPopoverOpen(false); }}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={!customFrom}
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Ingresos Totales" value={formatCurrency(totalIncome)} icon={TrendingUp} color="teal" />
        <StatCard title="Gastos Totales" value={formatCurrency(totalExpense)} icon={TrendingDown} color="red" />
        <StatCard title="Resultado Neto" value={formatCurrency(netResult)} icon={DollarSign} color={netResult >= 0 ? "emerald" : "red"} />
        <StatCard title="Margen Neto" value={`${margin}%`} icon={netResult >= 0 ? ArrowUpRight : ArrowDownRight} color={netResult >= 0 ? "emerald" : "red"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Por Cobrar" value={formatCurrency(pendingIncome)} icon={TrendingUp} color="amber" />
        <StatCard title="Por Pagar" value={formatCurrency(pendingExpense)} icon={TrendingDown} color="amber" />
        <StatCard title="Clientes" value={customers.length} icon={Users} color="blue" />
        <StatCard title="Proveedores" value={suppliers.length} icon={Truck} color="violet" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ingresos vs Gastos (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="ingresos" stroke="#0d9488" fill="url(#colorInc)" strokeWidth={2} />
              <Area type="monotone" dataKey="gastos" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Resultado Neto Mensual</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="resultado" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Gastos por Categoría</h3>
          {expenseByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expenseByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {expenseByCat.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-16 text-sm">Sin datos</p>}
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ingresos por Categoría</h3>
          {incomeByCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomeByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {incomeByCat.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-16 text-sm">Sin datos</p>}
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 5 Clientes</h3>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ["bg-teal-100 text-teal-700","bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-amber-100 text-amber-700","bg-pink-100 text-pink-700"][idx]
                    }`}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-slate-400 py-16 text-sm">Sin datos</p>}
        </Card>
      </div>
    </div>
  );
}