"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportRow = Record<string, string | number | Date | null | undefined>;

export function ExportButtons({ rows, filename }: { rows: ExportRow[]; filename: string }) {
  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    const headers = Object.keys(rows[0] ?? { reporte: "Sin datos" });
    autoTable(doc, {
      head: [headers],
      body: rows.map((row) => headers.map((header) => String(row[header] ?? ""))),
      styles: { fontSize: 8 }
    });
    doc.save(`${filename}.pdf`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" onClick={exportExcel}>
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button type="button" variant="ghost" onClick={exportPdf}>
        <Download className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
