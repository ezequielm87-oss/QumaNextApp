import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function DataTable({ columns, data, isLoading, onEdit, onDelete }) {
  const formatCell = (col, row) => {
    const val = row[col.key];
    if (val === undefined || val === null) return "—";
    if (col.type === "currency") return `$${Number(val).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    if (col.type === "date" && val) {
      try { return format(new Date(val), "dd/MM/yyyy"); } catch { return val; }
    }
    if (col.type === "badge") {
      const colorMap = col.colorMap || {};
      return <Badge className={colorMap[val] || "bg-slate-100 text-slate-700"}>{val?.replace(/_/g, " ")}</Badge>;
    }
    return val;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">No hay registros cargados aún</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              {columns.map((col) => (
                <TableHead key={col.key} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </TableHead>
              ))}
              {(onEdit || onDelete) && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-sm text-slate-700">
                    {formatCell(col, row)}
                  </TableCell>
                ))}
                {(onEdit || onDelete) && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(row)}>
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(row)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}