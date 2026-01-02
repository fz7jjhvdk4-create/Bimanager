"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Hexagon,
  MapPin,
  Scale,
  Calendar,
  Activity,
  Download,
  Package,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Statistics {
  year: string;
  colonyStats: {
    total: number;
    active: number;
    lost: number;
    sold: number;
    merged: number;
  };
  harvest: {
    total: number;
    byMonth: Record<string, number>;
    byApiary: { name: string; amount: number }[];
  };
  eventStats: {
    total: number;
    byType: Record<string, number>;
    byMonth: Record<string, number>;
  };
  economyStats: {
    income: number;
    expenses: number;
    profit: number;
    incomeMoms: number;
    expensesMoms: number;
    netMoms: number;
    incomeByMonth: Record<string, number>;
    expensesByMonth: Record<string, number>;
    totalJarsSold: number;
    jarsSoldByMonth: Record<string, number>;
  };
  apiaryStats: {
    id: string;
    name: string;
    totalColonies: number;
    activeColonies: number;
    harvest: number;
  }[];
  yearlyStats: Record<string, { harvest: number; colonies: number }>;
  queenStats: {
    total: number;
    byRace: Record<string, number>;
    byYear: Record<string, number>;
    wingClipped: number;
  };
}

const MONTHS = [
  "jan.",
  "feb.",
  "mar.",
  "apr.",
  "maj",
  "jun.",
  "jul.",
  "aug.",
  "sep.",
  "okt.",
  "nov.",
  "dec.",
];

export default function StatistikPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  async function fetchStatistics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/statistics?year=${selectedYear}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!stats) return;

    const report = `
BIMANAGER - ÅRSRAPPORT ${selectedYear}
${"=".repeat(50)}

SAMHÄLLEN
---------
Totalt antal: ${stats.colonyStats.total}
Aktiva: ${stats.colonyStats.active}
Förlorade: ${stats.colonyStats.lost}
Avyttrade: ${stats.colonyStats.sold}
Sammanslagna: ${stats.colonyStats.merged}

SKÖRD
-----
Total skörd: ${stats.harvest.total.toFixed(1)} kg
Genomsnitt per aktivt samhälle: ${stats.colonyStats.active > 0 ? (stats.harvest.total / stats.colonyStats.active).toFixed(1) : 0} kg

Skörd per bigård:
${stats.harvest.byApiary.map((a) => `  ${a.name}: ${a.amount.toFixed(1)} kg`).join("\n")}

EKONOMI
-------
Intäkter: ${stats.economyStats.income.toLocaleString("sv-SE")} kr
Utgifter: ${stats.economyStats.expenses.toLocaleString("sv-SE")} kr
Resultat: ${stats.economyStats.profit.toLocaleString("sv-SE")} kr

Moms:
  Utgående moms: ${stats.economyStats.incomeMoms.toLocaleString("sv-SE")} kr
  Ingående moms: ${stats.economyStats.expensesMoms.toLocaleString("sv-SE")} kr
  Moms att redovisa: ${stats.economyStats.netMoms.toLocaleString("sv-SE")} kr

HÄNDELSER
---------
Totalt antal: ${stats.eventStats.total}
${Object.entries(stats.eventStats.byType)
  .map(([type, count]) => `  ${type}: ${count}`)
  .join("\n")}

DROTTNINGAR
-----------
Totalt aktiva: ${stats.queenStats.total}
Vingklippta: ${stats.queenStats.wingClipped}

Per ras:
${Object.entries(stats.queenStats.byRace)
  .map(([race, count]) => `  ${race}: ${count}`)
  .join("\n") || "  Ingen data"}

${"=".repeat(50)}
Genererad: ${new Date().toLocaleString("sv-SE")}
    `.trim();

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bimanager_rapport_${selectedYear}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-amber-600">Laddar statistik...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-amber-600">
        Kunde inte ladda statistik
      </div>
    );
  }

  const maxJarsSold = Math.max(...Object.values(stats.economyStats.jarsSoldByMonth || {}), 1);
  const maxIncome = Math.max(
    ...Object.values(stats.economyStats.incomeByMonth),
    ...Object.values(stats.economyStats.expensesByMonth),
    1
  );

  // Beräkna ackumulerade värden för burkar
  const cumulativeJars = MONTHS.reduce((acc, month, index) => {
    const value = stats.economyStats.jarsSoldByMonth?.[month] || 0;
    const prev = index > 0 ? acc[MONTHS[index - 1]] : 0;
    acc[month] = prev + value;
    return acc;
  }, {} as Record<string, number>);
  const maxCumulativeJars = Math.max(...Object.values(cumulativeJars), 1);

  // Beräkna ackumulerat resultat (intäkter - utgifter)
  const cumulativeProfit = MONTHS.reduce((acc, month, index) => {
    const income = stats.economyStats.incomeByMonth[month] || 0;
    const expenses = stats.economyStats.expensesByMonth[month] || 0;
    const monthProfit = income - expenses;
    const prev = index > 0 ? acc[MONTHS[index - 1]] : 0;
    acc[month] = prev + monthProfit;
    return acc;
  }, {} as Record<string, number>);
  const maxAbsProfit = Math.max(
    Math.abs(Math.min(...Object.values(cumulativeProfit))),
    Math.abs(Math.max(...Object.values(cumulativeProfit))),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Statistik & Rapporter
            </h1>
            <p className="text-[var(--muted)]">Översikt över din biodling</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportera rapport
          </Button>
        </div>
      </div>

      {/* Sammanfattningskort */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-[var(--muted)]">Aktiva samhällen</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {stats.colonyStats.active}
          </p>
          <p className="text-xs text-[var(--muted)]">
            av {stats.colonyStats.total} totalt
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-[var(--muted)]">Total skörd</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">
            {stats.harvest.total.toFixed(1)}
          </p>
          <p className="text-xs text-[var(--muted)]">kg honung</p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm text-[var(--muted)]">Intäkter</span>
          </div>
          <p className="text-3xl font-bold text-green-500">
            {(stats.economyStats.income / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-[var(--muted)]">kronor</p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-[var(--muted)]">Händelser</span>
          </div>
          <p className="text-3xl font-bold text-blue-500">
            {stats.eventStats.total}
          </p>
          <p className="text-xs text-[var(--muted)]">registrerade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sålda burkar per månad */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-[var(--foreground)]">Sålda burkar per månad</h2>
          </div>
          <div className="relative flex items-end gap-1 h-40">
            {/* Ackumulerad kurva */}
            <svg className="absolute inset-0 w-full h-32 pointer-events-none" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={MONTHS.map((month, index) => {
                  const cumValue = cumulativeJars[month] || 0;
                  const x = ((index + 0.5) / 12) * 100;
                  const y = maxCumulativeJars > 0 ? 100 - (cumValue / maxCumulativeJars) * 100 : 100;
                  return `${x}%,${y}%`;
                }).join(" ")}
              />
              {MONTHS.map((month, index) => {
                const cumValue = cumulativeJars[month] || 0;
                const x = ((index + 0.5) / 12) * 100;
                const y = maxCumulativeJars > 0 ? 100 - (cumValue / maxCumulativeJars) * 100 : 100;
                return (
                  <circle
                    key={month}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#dc2626"
                  />
                );
              })}
            </svg>
            {MONTHS.map((month) => {
              const value = stats.economyStats.jarsSoldByMonth?.[month] || 0;
              const height = maxJarsSold > 0 ? (value / maxJarsSold) * 100 : 0;
              return (
                <div
                  key={month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    {value > 0 && (
                      <span className="text-xs text-[var(--foreground)] mb-1">
                        {value}
                      </span>
                    )}
                    <div
                      className="w-full bg-amber-500 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: value > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)]">{month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-xs text-[var(--foreground)]">Per månad</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded-full" />
              <span className="text-xs text-[var(--foreground)]">Ackumulerat ({stats.economyStats.totalJarsSold || 0} st)</span>
            </div>
          </div>
        </div>

        {/* Ekonomi per månad */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-[var(--foreground)]">Ekonomi per månad</h2>
          </div>
          <div className="relative flex items-end gap-1 h-40">
            {/* Ackumulerad resultatkurva */}
            <svg className="absolute inset-0 w-full h-32 pointer-events-none z-10" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={MONTHS.map((month, index) => {
                  const cumValue = cumulativeProfit[month] || 0;
                  const x = ((index + 0.5) / 12) * 100;
                  // Centrera vid 50% för 0-värde, upp/ner beroende på plus/minus
                  const y = 50 - (cumValue / maxAbsProfit) * 50;
                  return `${x}%,${y}%`;
                }).join(" ")}
              />
              {MONTHS.map((month, index) => {
                const cumValue = cumulativeProfit[month] || 0;
                const x = ((index + 0.5) / 12) * 100;
                const y = 50 - (cumValue / maxAbsProfit) * 50;
                return (
                  <circle
                    key={month}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#7c3aed"
                  />
                );
              })}
              {/* Nollinje */}
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </svg>
            {MONTHS.map((month) => {
              const income = stats.economyStats.incomeByMonth[month] || 0;
              const expenses = stats.economyStats.expensesByMonth[month] || 0;
              const incomeHeight =
                maxIncome > 0 ? (income / maxIncome) * 100 : 0;
              const expensesHeight =
                maxIncome > 0 ? (expenses / maxIncome) * 100 : 0;
              return (
                <div
                  key={month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex items-end justify-center gap-0.5 h-32">
                    <div
                      className="w-2 bg-green-500 rounded-t transition-all"
                      style={{
                        height: `${incomeHeight}%`,
                        minHeight: income > 0 ? 4 : 0,
                      }}
                      title={`Intäkt: ${income.toFixed(0)} kr`}
                    />
                    <div
                      className="w-2 bg-red-500 rounded-t transition-all"
                      style={{
                        height: `${expensesHeight}%`,
                        minHeight: expenses > 0 ? 4 : 0,
                      }}
                      title={`Utgift: ${expenses.toFixed(0)} kr`}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)]">{month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs text-[var(--foreground)]">Intäkter</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-xs text-[var(--foreground)]">Utgifter</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-600 rounded-full" />
              <span className="text-xs text-[var(--foreground)]">Ack. resultat ({stats.economyStats.profit.toLocaleString("sv-SE")} kr)</span>
            </div>
          </div>
        </div>

        {/* Händelser per typ */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-[var(--foreground)]">Händelser per typ</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.eventStats.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage =
                  stats.eventStats.total > 0
                    ? (count / stats.eventStats.total) * 100
                    : 0;
                const colors: Record<string, string> = {
                  Inspektion: "bg-blue-500",
                  Skörd: "bg-yellow-500",
                  Invintring: "bg-indigo-500",
                  Avläggare: "bg-green-500",
                  Hälsoåtgärd: "bg-red-500",
                  Anteckning: "bg-gray-500",
                };
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--foreground)]">{type}</span>
                      <span className="text-[var(--foreground)] font-medium">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[type] || "bg-amber-500"} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(stats.eventStats.byType).length === 0 && (
              <p className="text-[var(--muted)] text-sm text-center py-4">
                Inga händelser registrerade
              </p>
            )}
          </div>
        </div>

        {/* Skörd per bigård */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-[var(--foreground)]">Skörd per bigård</h2>
          </div>
          {stats.harvest.byApiary.length > 0 ? (
            <div className="space-y-3">
              {stats.harvest.byApiary
                .sort((a, b) => b.amount - a.amount)
                .map((apiary) => {
                  const maxApiary = Math.max(
                    ...stats.harvest.byApiary.map((a) => a.amount)
                  );
                  const percentage =
                    maxApiary > 0 ? (apiary.amount / maxApiary) * 100 : 0;
                  return (
                    <div key={apiary.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--foreground)]">{apiary.name}</span>
                        <span className="text-[var(--foreground)] font-medium">
                          {apiary.amount.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-[var(--muted)] text-sm text-center py-4">
              Ingen skördedata
            </p>
          )}
        </div>

      </div>

      {/* Historisk skörd */}
      <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-[var(--foreground)]">
            Historisk skörd (senaste 5 åren)
          </h2>
        </div>
        <div className="flex items-end gap-4 h-48">
          {Object.entries(stats.yearlyStats).map(([year, data]) => {
            const maxYearly = Math.max(
              ...Object.values(stats.yearlyStats).map((d) => d.harvest),
              1
            );
            const height = (data.harvest / maxYearly) * 100;
            return (
              <div key={year} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-36">
                  {data.harvest > 0 && (
                    <span className="text-sm font-medium text-[var(--foreground)] mb-1">
                      {data.harvest.toFixed(0)} kg
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t transition-all ${
                      year === selectedYear ? "bg-amber-500" : "bg-amber-500/50"
                    }`}
                    style={{ height: `${height}%`, minHeight: data.harvest > 0 ? 8 : 0 }}
                  />
                </div>
                <span
                  className={`text-sm ${
                    year === selectedYear
                      ? "font-bold text-[var(--foreground)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {year}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ekonomisk sammanfattning */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-4">
          Ekonomisk sammanfattning {selectedYear}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-amber-100 text-sm">Intäkter</p>
            <p className="text-2xl font-bold">
              {stats.economyStats.income.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div>
            <p className="text-amber-100 text-sm">Utgifter</p>
            <p className="text-2xl font-bold">
              {stats.economyStats.expenses.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div>
            <p className="text-amber-100 text-sm">Resultat</p>
            <p
              className={`text-2xl font-bold ${
                stats.economyStats.profit >= 0
                  ? "text-green-200"
                  : "text-red-200"
              }`}
            >
              {stats.economyStats.profit.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <div>
            <p className="text-amber-100 text-sm">Moms att redovisa</p>
            <p className="text-2xl font-bold">
              {stats.economyStats.netMoms.toLocaleString("sv-SE")} kr
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-[var(--muted)]">
          © Utvecklad av Claes Hansen
        </p>
      </div>
    </div>
  );
}
