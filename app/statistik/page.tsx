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
  Crown,
  Activity,
  Download,
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
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
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

  const maxHarvest = Math.max(...Object.values(stats.harvest.byMonth), 1);
  const maxIncome = Math.max(
    ...Object.values(stats.economyStats.incomeByMonth),
    ...Object.values(stats.economyStats.expensesByMonth),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-amber-900">
              Statistik & Rapporter
            </h1>
            <p className="text-amber-600">Översikt över din biodling</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-amber-600">Aktiva samhällen</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">
            {stats.colonyStats.active}
          </p>
          <p className="text-xs text-amber-500">
            av {stats.colonyStats.total} totalt
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-amber-600">Total skörd</span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">
            {stats.harvest.total.toFixed(1)}
          </p>
          <p className="text-xs text-amber-500">kg honung</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm text-amber-600">Intäkter</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {(stats.economyStats.income / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-amber-500">kronor</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-amber-600">Händelser</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {stats.eventStats.total}
          </p>
          <p className="text-xs text-amber-500">registrerade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skörd per månad */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Skörd per månad</h2>
          </div>
          <div className="flex items-end gap-1 h-40">
            {MONTHS.map((month) => {
              const value = stats.harvest.byMonth[month] || 0;
              const height = maxHarvest > 0 ? (value / maxHarvest) * 100 : 0;
              return (
                <div
                  key={month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    {value > 0 && (
                      <span className="text-xs text-amber-600 mb-1">
                        {value.toFixed(0)}
                      </span>
                    )}
                    <div
                      className="w-full bg-yellow-400 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: value > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-xs text-amber-500">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ekonomi per månad */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Ekonomi per månad</h2>
          </div>
          <div className="flex items-end gap-1 h-40">
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
                      className="w-2 bg-green-400 rounded-t transition-all"
                      style={{
                        height: `${incomeHeight}%`,
                        minHeight: income > 0 ? 4 : 0,
                      }}
                      title={`Intäkt: ${income.toFixed(0)} kr`}
                    />
                    <div
                      className="w-2 bg-red-400 rounded-t transition-all"
                      style={{
                        height: `${expensesHeight}%`,
                        minHeight: expenses > 0 ? 4 : 0,
                      }}
                      title={`Utgift: ${expenses.toFixed(0)} kr`}
                    />
                  </div>
                  <span className="text-xs text-amber-500">{month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded" />
              <span className="text-xs text-amber-600">Intäkter</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-xs text-amber-600">Utgifter</span>
            </div>
          </div>
        </div>

        {/* Samhällsstatus */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Hexagon className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Samhällsstatus</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Aktiva",
                value: stats.colonyStats.active,
                color: "bg-green-500",
              },
              {
                label: "Förlorade",
                value: stats.colonyStats.lost,
                color: "bg-red-500",
              },
              {
                label: "Avyttrade",
                value: stats.colonyStats.sold,
                color: "bg-blue-500",
              },
              {
                label: "Sammanslagna",
                value: stats.colonyStats.merged,
                color: "bg-purple-500",
              },
            ].map((item) => {
              const percentage =
                stats.colonyStats.total > 0
                  ? (item.value / stats.colonyStats.total) * 100
                  : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-700">{item.label}</span>
                    <span className="text-amber-900 font-medium">
                      {item.value} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Händelser per typ */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Händelser per typ</h2>
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
                      <span className="text-amber-700">{type}</span>
                      <span className="text-amber-900 font-medium">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[type] || "bg-amber-500"} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(stats.eventStats.byType).length === 0 && (
              <p className="text-amber-500 text-sm text-center py-4">
                Inga händelser registrerade
              </p>
            )}
          </div>
        </div>

        {/* Skörd per bigård */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Skörd per bigård</h2>
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
                        <span className="text-amber-700">{apiary.name}</span>
                        <span className="text-amber-900 font-medium">
                          {apiary.amount.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
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
            <p className="text-amber-500 text-sm text-center py-4">
              Ingen skördedata
            </p>
          )}
        </div>

        {/* Drottningsstatistik */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Drottningar</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {stats.queenStats.total}
              </p>
              <p className="text-xs text-amber-600">Totalt</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {stats.queenStats.wingClipped}
              </p>
              <p className="text-xs text-amber-600">Vingklippta</p>
            </div>
          </div>
          {Object.keys(stats.queenStats.byRace).length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-700 mb-2">Per ras:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.queenStats.byRace).map(([race, count]) => (
                  <span
                    key={race}
                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs"
                  >
                    {race}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historisk skörd */}
      <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-amber-900">
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
                    <span className="text-sm font-medium text-amber-900 mb-1">
                      {data.harvest.toFixed(0)} kg
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t transition-all ${
                      year === selectedYear ? "bg-amber-500" : "bg-amber-300"
                    }`}
                    style={{ height: `${height}%`, minHeight: data.harvest > 0 ? 8 : 0 }}
                  />
                </div>
                <span
                  className={`text-sm ${
                    year === selectedYear
                      ? "font-bold text-amber-900"
                      : "text-amber-600"
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
    </div>
  );
}
