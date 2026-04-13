import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "controle_financeiro_marciel_v18";
const WEEKS_PER_MONTH = 4.33;

const defaultState = {
  mode: "quick",
  weeklyIncome: 650,
  daysPassed: 0,
  spentSoFar: 0,
  simulatedInstallment: 0,
  weeklyPlan: {
    contas: 175,
    saude: 50,
    investimento: 190,
    vida: 135,
    diversao: 50,
    seguranca: 50,
  },
  fixedAccounts: [
    { id: 1, name: "Ferramenta internacional A", value: 208.95, spent: 0 },
    { id: 2, name: "Ferramenta internacional B", value: 27.8, spent: 0 },
    { id: 3, name: "Ferramenta", value: 65.9, spent: 0 },
    { id: 4, name: "Ferramenta internacional C", value: 193.31, spent: 0 },
    { id: 5, name: "Parcela", value: 5.24, spent: 0 },
    { id: 6, name: "Parcela", value: 6.79, spent: 0 },
    { id: 7, name: "Academia", value: 107, spent: 0 },
    { id: 8, name: "Assinatura", value: 99.9, spent: 0 },
  ],
  detailedExpenses: [],
  entryDraft: {
    type: "expense",
    name: "",
    value: 0,
  },
  piggyBanks: {
    vida: 299.54,
    seguranca: 121.19,
    saude: 200.49,
    diversao: 0,
    contas: 118.19,
    investimento: 782.16,
  },
  piggyBankChecks: {
    vida: false,
    seguranca: false,
    saude: false,
    diversao: false,
    contas: false,
    investimento: false,
  },
};

function currency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function alertBoxClass(type) {
  if (type === "critical") return "border-red-200 bg-red-50";
  if (type === "warning") return "border-yellow-200 bg-yellow-50";
  if (type === "success") return "border-green-200 bg-green-50";
  return "border-blue-200 bg-blue-50";
}

function alertTitleClass(type) {
  if (type === "critical") return "text-red-700";
  if (type === "warning") return "text-yellow-800";
  if (type === "success") return "text-green-700";
  return "text-blue-700";
}

function SectionCard({ title, children, id }) {
  return (
    <section id={id} className="space-y-0">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </section>
  );
}

export default function ControleFinanceiroMarciel() {
  const [data, setData] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          ...defaultState,
          ...parsed,
          weeklyPlan: { ...defaultState.weeklyPlan, ...(parsed.weeklyPlan || {}) },
          piggyBanks: { ...defaultState.piggyBanks, ...(parsed.piggyBanks || {}) },
          piggyBankChecks: { ...defaultState.piggyBankChecks, ...(parsed.piggyBankChecks || {}) },
          fixedAccounts:
            Array.isArray(parsed.fixedAccounts) && parsed.fixedAccounts.length > 0
              ? parsed.fixedAccounts
              : defaultState.fixedAccounts,
          detailedExpenses: Array.isArray(parsed.detailedExpenses) ? parsed.detailedExpenses : [],
          entryDraft: { ...defaultState.entryDraft, ...(parsed.entryDraft || {}) },
        });
      } catch {
        setData(defaultState);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  function update(path, value) {
    setData((prev) => {
      const clone = structuredClone(prev);
      const keys = path.split(".");
      let obj = clone;
      keys.slice(0, -1).forEach((k) => {
        obj = obj[k];
      });
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  }

  function addEntry() {
    const name = String(data.entryDraft.name || "").trim();
    const value = Number(data.entryDraft.value || 0);
    if (!name || value <= 0) return;

    if (data.entryDraft.type === "fixed") {
      setData((prev) => ({
        ...prev,
        fixedAccounts: [...prev.fixedAccounts, { id: Date.now(), name, value, spent: 0 }],
        entryDraft: { ...prev.entryDraft, name: "", value: 0 },
      }));
      return;
    }

    setData((prev) => ({
      ...prev,
      detailedExpenses: [...prev.detailedExpenses, { id: Date.now(), name, value }],
      entryDraft: { ...prev.entryDraft, name: "", value: 0 },
    }));
  }

  function updateDetailedExpense(id, field, value) {
    setData((prev) => ({
      ...prev,
      detailedExpenses: prev.detailedExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      ),
    }));
  }

  function removeDetailedExpense(id) {
    setData((prev) => ({
      ...prev,
      detailedExpenses: prev.detailedExpenses.filter((expense) => expense.id !== id),
    }));
  }

  function updateFixedAccount(id, field, value) {
    setData((prev) => ({
      ...prev,
      fixedAccounts: prev.fixedAccounts.map((account) =>
        account.id === id ? { ...account, [field]: value } : account
      ),
    }));
  }

  const detailedExpensesTotal = data.detailedExpenses.reduce(
    (sum, expense) => sum + Number(expense.value || 0),
    0
  );
  const detailedFixedAccountsTotal = data.fixedAccounts.reduce(
    (sum, account) => sum + Number(account.value || 0),
    0
  );
  const totalFixedAccountsSpent = data.fixedAccounts.reduce(
    (sum, account) => sum + Number(account.spent || 0),
    0
  );
  const totalFixedAccountsRemaining = Math.max(0, detailedFixedAccountsTotal - totalFixedAccountsSpent);

  const weeklyFlexible = Number(data.weeklyPlan.vida || 0) + Number(data.weeklyPlan.diversao || 0);
  const effectiveSpentSoFar = Number(data.spentSoFar || 0) + detailedExpensesTotal;
  const dailyLimit = weeklyFlexible / 7;
  const safeDaysPassed = Math.max(0, Math.min(7, Number(data.daysPassed || 0)));
  const idealSpent = dailyLimit * safeDaysPassed;
  const difference = effectiveSpentSoFar - idealSpent;
  const remainingWeek = weeklyFlexible - effectiveSpentSoFar;
  const allowedToday = Math.max(0, weeklyFlexible - effectiveSpentSoFar);

  let weeklyStatus = "—";
  if (safeDaysPassed > 0) {
    if (difference <= 0) weeklyStatus = "Seguro";
    else if (difference <= 20) weeklyStatus = "Atenção";
    else weeklyStatus = "Estourado";
  }

  const totalFixedExpenses = detailedFixedAccountsTotal;
  const monthlyPlanContas = Number(data.weeklyPlan.contas || 0) * WEEKS_PER_MONTH;
  const totalSimulatedExpenses = totalFixedExpenses + Number(data.simulatedInstallment || 0);
  const contasCoverage = totalSimulatedExpenses > 0 ? (monthlyPlanContas / totalSimulatedExpenses) * 100 : 100;
  const suggestedWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
  const contasShortfallWeekly = round2(Math.max(0, suggestedWeeklyContas - Number(data.weeklyPlan.contas || 0)));

  const monthlyInvestment = Number(data.weeklyPlan.investimento || 0) * WEEKS_PER_MONTH;
  const totalPiggyBanks = Object.values(data.piggyBanks || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const recommendedContasBuffer = round2(totalSimulatedExpenses * 0.2);
  const piggyContasGap = round2(totalSimulatedExpenses - Number(data.piggyBanks.contas || 0));
  const piggyInvestimentoMonthlyGap = round2(monthlyInvestment - Number(data.piggyBanks.investimento || 0));

  const contasPiggyStatus =
    Number(data.piggyBanks.contas || 0) >= totalSimulatedExpenses
      ? "Coberto"
      : Number(data.piggyBanks.contas || 0) >= totalSimulatedExpenses * 0.7
        ? "Atenção"
        : "Crítico";

  const investimentoPiggyStatus =
    Number(data.piggyBanks.investimento || 0) >= monthlyInvestment * 3
      ? "Forte"
      : Number(data.piggyBanks.investimento || 0) >= monthlyInvestment
        ? "Ok"
        : "Fraco";

  const intelligentAlerts = useMemo(() => {
    return [
      Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses
        ? {
            type: Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses * 0.7 ? "critical" : "warning",
            title: "Cofrinho de contas abaixo do necessário",
            message: `Faltam ${currency(Math.max(0, piggyContasGap))} para cobrir 1 mês completo de contas.`,
          }
        : null,
      Number(data.piggyBanks.contas || 0) >= totalSimulatedExpenses &&
      Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses + recommendedContasBuffer
        ? {
            type: "info",
            title: "Cofrinho de contas coberto, mas sem folga",
            message: `Seu colchão ideal para contas seria pelo menos ${currency(recommendedContasBuffer)} além do valor mensal.`,
          }
        : null,
      Number(data.piggyBanks.investimento || 0) < monthlyInvestment
        ? {
            type: "warning",
            title: "Cofrinho de investimento fraco para o ritmo atual",
            message: `Ele está ${currency(Math.max(0, piggyInvestimentoMonthlyGap))} abaixo de 1 mês do seu próprio aporte planejado.`,
          }
        : null,
      Number(data.piggyBanks.investimento || 0) >= monthlyInvestment * 3
        ? {
            type: "success",
            title: "Cofrinho de investimento em nível saudável",
            message: "Você já acumulou pelo menos 3 meses do seu aporte mensal planejado.",
          }
        : null,
    ].filter(Boolean);
  }, [data.piggyBanks, totalSimulatedExpenses, piggyContasGap, recommendedContasBuffer, monthlyInvestment, piggyInvestimentoMonthlyGap]);

  function applySuggestedContasAdjustment() {
    const neededWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
    const currentWeeklyContas = Number(data.weeklyPlan.contas || 0);
    const delta = round2(neededWeeklyContas - currentWeeklyContas);
    if (delta <= 0) return;

    setData((prev) => {
      const clone = structuredClone(prev);
      clone.weeklyPlan.contas = neededWeeklyContas;
      let remaining = delta;
      const adjustableFields = ["diversao", "seguranca", "vida", "saude"];
      adjustableFields.forEach((field) => {
        if (remaining <= 0) return;
        const currentValue = Number(clone.weeklyPlan[field] || 0);
        const reduction = Math.min(currentValue, remaining);
        clone.weeklyPlan[field] = round2(currentValue - reduction);
        remaining = round2(remaining - reduction);
      });
      if (remaining > 0) {
        clone.weeklyPlan.investimento = round2(Math.max(0, Number(clone.weeklyPlan.investimento || 0) - remaining));
      }
      return clone;
    });
  }

  const distributionTargets = {
    contas: {
      weekly: Number(data.weeklyPlan.contas || 0),
      monthly: round2(Number(data.weeklyPlan.contas || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.contas || 0),
    },
    saude: {
      weekly: Number(data.weeklyPlan.saude || 0),
      monthly: round2(Number(data.weeklyPlan.saude || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.saude || 0),
    },
    investimento: {
      weekly: Number(data.weeklyPlan.investimento || 0),
      monthly: round2(Number(data.weeklyPlan.investimento || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.investimento || 0),
    },
    vida: {
      weekly: Number(data.weeklyPlan.vida || 0),
      monthly: round2(Number(data.weeklyPlan.vida || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.vida || 0),
    },
    diversao: {
      weekly: Number(data.weeklyPlan.diversao || 0),
      monthly: round2(Number(data.weeklyPlan.diversao || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.diversao || 0),
    },
    seguranca: {
      weekly: Number(data.weeklyPlan.seguranca || 0),
      monthly: round2(Number(data.weeklyPlan.seguranca || 0) * WEEKS_PER_MONTH),
      current: Number(data.piggyBanks.seguranca || 0),
    },
  };

  const distributionSummary = Object.values(distributionTargets).reduce(
    (acc, item) => {
      acc.weekly += item.weekly;
      acc.monthly += item.monthly;
      return acc;
    },
    { weekly: 0, monthly: 0 }
  );

  return (
    <div className="space-y-4 p-4 pb-24 md:space-y-6 md:p-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 md:p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Controle Financeiro</p>
          <h1 className="text-xl font-bold md:text-2xl">Marciel</h1>
        </div>
        <div className="flex gap-2">
          <Button variant={data.mode === "quick" ? "default" : "outline"} onClick={() => update("mode", "quick")}>Rápido</Button>
          <Button variant={data.mode === "full" ? "default" : "outline"} onClick={() => update("mode", "full")}>Completo</Button>
        </div>
      </div>

      {data.mode === "quick" && (
        <>
          <SectionCard title="Lançamento rápido" id="quick-top">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Natureza</Label>
                <select
                  className="w-full rounded-md border bg-white px-3 py-2"
                  value={data.entryDraft.type}
                  onChange={(e) => update("entryDraft.type", e.target.value)}
                >
                  <option value="expense">Gasto</option>
                  <option value="fixed">Conta Fixa</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>{data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}</Label>
                <Input
                  type="text"
                  value={data.entryDraft.name}
                  onChange={(e) => update("entryDraft.name", e.target.value)}
                  placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.entryDraft.value}
                  onChange={(e) => update("entryDraft.value", Number(e.target.value))}
                />
              </div>
            </div>
            <Button className="w-full md:w-auto" onClick={addEntry}>Salvar lançamento</Button>
          </SectionCard>

          <SectionCard title="Resumo rápido">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Gasto total detalhado</p>
                <p className="text-2xl font-bold text-red-600">{currency(detailedExpensesTotal)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Gasto efetivo da semana</p>
                <p className="text-2xl font-bold">{currency(effectiveSpentSoFar)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Disponível hoje</p>
                <p className="text-2xl font-bold text-blue-700">{currency(allowedToday)}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Gastos recentes" id="quick-gastos">
            {data.detailedExpenses.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum gasto ainda.</p>
            ) : (
              <div className="space-y-2">
                {[...data.detailedExpenses].slice(-10).reverse().map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                    <div>
                      <p className="font-medium">{expense.name}</p>
                    </div>
                    <p className="font-bold text-red-600">{currency(expense.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 p-3 backdrop-blur md:hidden">
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Topo</Button>
              <Button className="flex-1" onClick={addEntry}>Salvar</Button>
            </div>
          </div>
        </>
      )}

      {data.mode === "full" && (
        <>
          <div className="flex gap-2 overflow-x-auto rounded-xl border bg-white p-2 text-sm">
            <a href="#full-visao" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Visão</a>
            <a href="#full-semana" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Semana</a>
            <a href="#full-parcelas" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Parcelas</a>
            <a href="#full-contas" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Contas</a>
            <a href="#full-gastos" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Gastos</a>
            <a href="#full-alertas" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Alertas</a>
            <a href="#full-cofrinhos" className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100">Cofrinhos</a>
          </div>

          <SectionCard title="Visão Geral" id="full-visao">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 p-4">
                <p>Contas mensais</p>
                <p className="font-bold">{currency(totalSimulatedExpenses)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p>Você separa</p>
                <p className="font-bold">{currency(monthlyPlanContas)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p>Status</p>
                <Badge>{contasCoverage >= 100 ? "Seguro" : "Risco"}</Badge>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Controle da Semana" id="full-semana">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Dias passados</Label>
                <Input type="number" min="0" max="7" value={data.daysPassed} onChange={(e) => update("daysPassed", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Gasto na semana</Label>
                <Input type="number" min="0" value={data.spentSoFar} onChange={(e) => update("spentSoFar", Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-slate-600">Limite semanal</p>
                <p className="font-semibold">{currency(weeklyFlexible)}</p>
              </div>
              <div>
                <p className="text-slate-600">Limite por dia</p>
                <p className="font-semibold">{currency(dailyLimit)}</p>
              </div>
              <div>
                <p className="text-slate-600">Ideal até agora</p>
                <p className="font-semibold">{currency(idealSpent)}</p>
              </div>
              <div>
                <p className="text-slate-600">Diferença</p>
                <p className={difference > 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>{currency(difference)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-600">Status da semana</p>
              <Badge>{weeklyStatus}</Badge>
            </div>

            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-600">Disponível na semana (Vida diária + Diversão)</p>
              <p className="text-2xl font-bold text-blue-700">{currency(allowedToday)}</p>
              <p className="mt-3 text-sm text-slate-600">Restante da semana</p>
              <p className="font-semibold">{currency(remainingWeek)}</p>
            </div>
          </SectionCard>

          <SectionCard title="Simulador de Parcelas" id="full-parcelas">
            <div className="space-y-2">
              <Label>Nova parcela mensal</Label>
              <Input type="number" min="0" value={data.simulatedInstallment} onChange={(e) => update("simulatedInstallment", Number(e.target.value))} />
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-slate-600">Contas mensais atuais</p>
                <p className="font-semibold">{currency(totalFixedExpenses)}</p>
              </div>
              <div>
                <p className="text-slate-600">Nova parcela simulada</p>
                <p className="font-semibold">{currency(data.simulatedInstallment)}</p>
              </div>
              <div>
                <p className="text-slate-600">Novo total de contas</p>
                <p className="font-semibold">{currency(totalSimulatedExpenses)}</p>
              </div>
              <div>
                <p className="text-slate-600">Você separa por mês</p>
                <p className="font-semibold">{currency(monthlyPlanContas)}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 p-4 space-y-3">
              <div>
                <p className="text-sm text-slate-600">Impacto da simulação</p>
                <p className="mt-1 font-semibold">Cobertura das contas: {round2(contasCoverage).toFixed(1)}%</p>
                <p className="mt-2 text-sm">
                  {Number(data.simulatedInstallment) > 0
                    ? contasCoverage >= 100
                      ? "A nova parcela ainda cabe no plano atual."
                      : "A nova parcela quebra a cobertura das contas. Ajuste antes de comprar."
                    : "Digite um valor para testar uma compra parcelada antes de decidir."}
                </p>
              </div>

              {Number(data.simulatedInstallment) > 0 && contasCoverage < 100 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-yellow-800">Ajuste automático sugerido</p>
                    <p className="mt-1 text-sm text-slate-700">Para a nova parcela caber, o sistema sugere subir <strong>Contas</strong> para {currency(suggestedWeeklyContas)} por semana.</p>
                    <p className="mt-1 text-sm text-slate-700">Diferença necessária: <strong>{currency(contasShortfallWeekly)}</strong> por semana.</p>
                  </div>
                  <Button type="button" onClick={applySuggestedContasAdjustment}>Ajustar automaticamente o plano</Button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Adicionar lançamento" id="full-lancar">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Natureza</Label>
                <select className="w-full rounded-md border bg-white px-3 py-2" value={data.entryDraft.type} onChange={(e) => update("entryDraft.type", e.target.value)}>
                  <option value="expense">Gasto</option>
                  <option value="fixed">Conta Fixa</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}</Label>
                <Input type="text" value={data.entryDraft.name} onChange={(e) => update("entryDraft.name", e.target.value)} placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" min="0" value={data.entryDraft.value} onChange={(e) => update("entryDraft.value", Number(e.target.value))} />
              </div>
            </div>
            <Button className="w-full md:w-auto" onClick={addEntry}>Adicionar lançamento</Button>
          </SectionCard>

          <SectionCard title="Contas Fixas Detalhadas" id="full-contas">
            <details className="rounded-xl border bg-slate-50 p-4" open>
              <summary className="cursor-pointer font-semibold text-slate-800">Contas cadastradas</summary>
              <div className="mt-4 space-y-3">
                {data.fixedAccounts.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma conta fixa cadastrada.</p>
                ) : (
                  data.fixedAccounts.map((account) => (
                    <div key={account.id} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-[1fr_140px_160px]">
                      <div className="space-y-2">
                        <Label>Nome da conta</Label>
                        <Input type="text" value={account.name} onChange={(e) => updateFixedAccount(account.id, "name", e.target.value)} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Valor mensal</p>
                        <p className="font-semibold">{currency(account.value)}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Lançar gasto</Label>
                        <Input type="number" min="0" value={account.spent} onChange={(e) => updateFixedAccount(account.id, "spent", Number(e.target.value))} />
                      </div>
                    </div>
                  ))
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Total das contas fixas</p>
                    <p className="font-bold">{currency(detailedFixedAccountsTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Total de gastos lançados</p>
                    <p className="font-bold">{currency(totalFixedAccountsSpent)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Restante das contas fixas</p>
                    <p className="font-bold">{currency(totalFixedAccountsRemaining)}</p>
                  </div>
                </div>
              </div>
            </details>
          </SectionCard>

          <SectionCard title="Gastos Detalhados" id="full-gastos">
            <details className="rounded-xl border bg-slate-50 p-4" open>
              <summary className="cursor-pointer font-semibold text-slate-800">Gastos cadastrados</summary>
              <div className="mt-4 space-y-3">
                {data.detailedExpenses.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum gasto detalhado adicionado.</p>
                ) : (
                  data.detailedExpenses.map((expense) => (
                    <div key={expense.id} className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-[1fr_180px_100px]">
                      <div className="space-y-2">
                        <Label>Nome do gasto</Label>
                        <Input type="text" value={expense.name} onChange={(e) => updateDetailedExpense(expense.id, "name", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input type="number" min="0" value={expense.value} onChange={(e) => updateDetailedExpense(expense.id, "value", Number(e.target.value))} />
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" onClick={() => removeDetailedExpense(expense.id)} type="button" className="w-full">Remover</Button>
                      </div>
                    </div>
                  ))
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Total dos gastos detalhados</p>
                    <p className="font-bold">{currency(detailedExpensesTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm text-slate-600">Gasto efetivo da semana</p>
                    <p className="font-bold">{currency(effectiveSpentSoFar)}</p>
                  </div>
                </div>
              </div>
            </details>
          </SectionCard>

          <SectionCard title="Alertas Inteligentes dos Cofrinhos" id="full-alertas">
            {intelligentAlerts.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-green-700">Nenhum alerta crítico no momento</p>
                <p className="mt-1 text-sm text-slate-700">Seus cofrinhos principais estão coerentes com o plano atual.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {intelligentAlerts.map((alert) => (
                  <div key={alert.title} className={`rounded-xl border p-4 ${alertBoxClass(alert.type)}`}>
                    <p className={`font-semibold ${alertTitleClass(alert.type)}`}>{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-slate-600">Status do cofrinho de contas</p>
                <p className="mt-1 font-bold">{contasPiggyStatus}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-slate-600">Status do cofrinho de investimento</p>
                <p className="mt-1 font-bold">{investimentoPiggyStatus}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Visão dos Cofrinhos" id="full-cofrinhos">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(data.piggyBanks).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm capitalize text-slate-600">{k}</p>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={Boolean(data.piggyBankChecks?.[k])} onChange={(e) => update(`piggyBankChecks.${k}`, e.target.checked)} />
                      Atualizado
                    </label>
                  </div>
                  <Input type="number" min="0" value={v} onChange={(e) => update(`piggyBanks.${k}`, Number(e.target.value))} />
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{currency(v)}</p>
                    <Badge>{data.piggyBankChecks?.[k] ? "Conferido" : "Pendente"}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Total em todos os cofrinhos</p>
                <p className="font-bold">{currency(totalPiggyBanks)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Falta para contas fecharem 1 mês</p>
                <p className={`font-bold ${piggyContasGap > 0 ? "text-red-600" : "text-green-700"}`}>{currency(Math.max(0, piggyContasGap))}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Meta mínima sugerida em investimento</p>
                <p className="font-bold">{currency(monthlyInvestment)}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Distribuição por Cofrinho" id="full-distribuicao">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(distributionTargets).map(([key, item]) => (
                <div key={key} className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm capitalize text-slate-600">{key}</p>
                  <p className="mt-2 text-sm">Semanal: <strong className="text-green-600">{currency(item.weekly)}</strong></p>
                  <p className="text-sm">Mensal: <strong>{currency(item.monthly)}</strong></p>
                  <p className="text-sm">Saldo atual: <strong>{currency(item.current)}</strong></p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Total da distribuição semanal</p>
                <p className="font-bold">{currency(distributionSummary.weekly)}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-600">Total da distribuição mensal</p>
                <p className="font-bold">{currency(distributionSummary.monthly)}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Investimento" id="full-investimento">
            <div className="rounded-xl bg-slate-100 p-4">
              <p>Você investe por mês:</p>
              <p className="font-bold">{currency(monthlyInvestment)}</p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
