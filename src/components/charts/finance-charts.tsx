"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const colors = ["#42ff91", "#38bdf8", "#a78bfa", "#ff5a2f", "#f5c451", "#ff5c7a"];

function tooltipFormatter(value: unknown) {
  return formatCurrency(Number(value), "ARS");
}

export function CashflowChart({ data }: { data: Array<{ month: string; ingresos: number; egresos: number; saldo: number }> }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Mensual</CardDescription>
          <CardTitle>Ingresos vs egresos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#a9a7ba", fontSize: 12 }} />
            <YAxis hide />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: "#121522", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18 }} />
            <Bar dataKey="ingresos" fill="#42ff91" radius={[12, 12, 0, 0]} />
            <Bar dataKey="egresos" fill="#ff5a2f" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function BalanceAreaChart({ data }: { data: Array<{ month: string; saldo: number }> }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Forecast</CardDescription>
          <CardTitle>Saldo estimado</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#42ff91" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#42ff91" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#a9a7ba", fontSize: 12 }} />
            <YAxis hide />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: "#121522", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18 }} />
            <Area type="monotone" dataKey="saldo" stroke="#42ff91" strokeWidth={3} fill="url(#balance)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function GrowthLineChart({ data }: { data: Array<{ month: string; saldo: number }> }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Crecimiento</CardDescription>
          <CardTitle>Tendencia financiera</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#a9a7ba", fontSize: 12 }} />
            <YAxis hide />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: "#121522", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18 }} />
            <Line type="monotone" dataKey="saldo" stroke="#38bdf8" strokeWidth={3} dot={{ fill: "#42ff91", strokeWidth: 0, r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ServicePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Servicios</CardDescription>
          <CardTitle>Mas vendidos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#121522", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
