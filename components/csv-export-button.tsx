"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function escapeCsvValue(value: string | number | null): string {
  const str = value === null ? "" : String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function CsvExportButton({ filename, headers, rows }: { filename: string; headers: string[]; rows: (string | number | null)[][] }) {
  function handleExport() {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(";"));
    const csv = lines.join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport}>
      <Download className="size-3.5" /> Exportar CSV
    </Button>
  );
}
