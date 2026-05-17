import type * as React from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  headers,
  rows,
  empty = "Sin datos para mostrar."
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  empty?: string;
}) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/15">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-white/[0.035]">
            {headers.map((header) => (
              <th key={header} className="border-b border-white/10 px-4 py-3 text-left text-xs font-black uppercase text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index} className={cn("transition hover:bg-primary/[0.045]", index !== rows.length - 1 && "border-b border-white/10")}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-sm font-medium text-white/88">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
