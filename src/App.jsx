import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "controle_financeiro_marciel_v19";
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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function cardStyle() {
  return {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
  };
}

function inputStyle() {
  return {
    width: "100%",
    minHeight: 42,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
  };
}

function buttonStyle(primary = true) {
  return {
    minHeight: 42,
    borderRadius: 10,
    padding: "10px 14px",
    border: primary ? "none" : "1px solid #cbd5e1",
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#0f172a",
    cursor: "pointer",
    fontWeight: 600,
  };
}

function Section({ title, children, id }) {
  return (
    <section id={id} style={cardStyle()}>
      <h2 style={{ margin: 0, marginBottom: 16, fontSize: 22 }}>{title}</h2>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </section>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 20, color: color || "#0f172a" }}>{value}</div>
    </div>
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
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, loaded]);

  function update(path, value) {
    setData((prev) => {
      const next = clone(prev);
      const keys = path.split(".");
      let obj = next;
      keys.slice(0, -1).forEach((k) => {
        obj = obj[k];
      });
      obj[keys[keys.length - 1]] = value;
      return next;
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

  function updateFixedAccount(id, field, value) {
    setData((prev) => ({
      ...prev,
      fixedAccounts: prev.fixedAccounts.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function updateDetailedExpense(id, field, value) {
    setData((prev) => ({
      ...prev,
      detailedExpenses: prev.detailedExpenses.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeDetailedExpense(id) {
    setData((prev) => ({
      ...prev,
      detailedExpenses: prev.detailedExpenses.filter((item) => item.id !== id),
    }));
  }

  const detailedExpensesTotal = data.detailedExpenses.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const detailedFixedAccountsTotal = data.fixedAccounts.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalFixedAccountsSpent = data.fixedAccounts.reduce((sum, item) => sum + Number(item.spent || 0), 0);
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
  const totalPiggyBanks = Object.values(data.piggyBanks || {}).reduce((sum, value) => sum + Number(value || 0), 0);
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
      Number(data.piggyBanks.contas || 0) >= totalSimulatedExpenses && Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses + recommendedContasBuffer
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
    ].filter(Boolean);
  }, [data.piggyBanks, totalSimulatedExpenses, piggyContasGap, recommendedContasBuffer, monthlyInvestment, piggyInvestimentoMonthlyGap]);

  function applySuggestedContasAdjustment() {
    const neededWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
    const currentWeeklyContas = Number(data.weeklyPlan.contas || 0);
    const delta = round2(neededWeeklyContas - currentWeeklyContas);
    if (delta <= 0) return;

    setData((prev) => {
      const next = clone(prev);
      next.weeklyPlan.contas = neededWeeklyContas;
      let remaining = delta;
      const adjustableFields = ["diversao", "seguranca", "vida", "saude"];
      adjustableFields.forEach((field) => {
        if (remaining <= 0) return;
        const currentValue = Number(next.weeklyPlan[field] || 0);
        const reduction = Math.min(currentValue, remaining);
        next.weeklyPlan[field] = round2(currentValue - reduction);
        remaining = round2(remaining - reduction);
      });
      if (remaining > 0) {
        next.weeklyPlan.investimento = round2(Math.max(0, Number(next.weeklyPlan.investimento || 0) - remaining));
      }
      return next;
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
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: 16, paddingBottom: 90, color: "#0f172a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ ...cardStyle(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 }}>Controle Financeiro</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Marciel</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={buttonStyle(data.mode === "quick")} onClick={() => update("mode", "quick")}>Rápido</button>
            <button style={buttonStyle(data.mode === "full")} onClick={() => update("mode", "full")}>Completo</button>
          </div>
        </div>

        {data.mode === "quick" && (
          <>
            <Section title="Lançamento rápido" id="quick-top">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Natureza</div>
                  <select style={inputStyle()} value={data.entryDraft.type} onChange={(e) => update("entryDraft.type", e.target.value)}>
                    <option value="expense">Gasto</option>
                    <option value="fixed">Conta Fixa</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}</div>
                  <input style={inputStyle()} value={data.entryDraft.name} onChange={(e) => update("entryDraft.name", e.target.value)} placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Valor</div>
                  <input type="number" min="0" style={inputStyle()} value={data.entryDraft.value} onChange={(e) => update("entryDraft.value", Number(e.target.value))} />
                </div>
              </div>
              <div>
                <button style={{ ...buttonStyle(true), width: "100%" }} onClick={addEntry}>Salvar lançamento</button>
              </div>
            </Section>

            <Section title="Resumo rápido">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Gasto total detalhado" value={currency(detailedExpensesTotal)} color="#dc2626" />
                <StatBox label="Gasto efetivo da semana" value={currency(effectiveSpentSoFar)} />
                <StatBox label="Disponível hoje" value={currency(allowedToday)} color="#2563eb" />
              </div>
            </Section>

            <Section title="Gastos recentes" id="quick-gastos">
              {data.detailedExpenses.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhum gasto ainda.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {[...data.detailedExpenses].slice(-10).reverse().map((expense) => (
                    <div key={expense.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                      <div style={{ fontWeight: 500 }}>{expense.name}</div>
                      <div style={{ fontWeight: 700, color: "#dc2626" }}>{currency(expense.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {data.mode === "full" && (
          <>
            <div style={{ ...cardStyle(), display: "flex", gap: 8, overflowX: "auto", whiteSpace: "nowrap" }}>
              {[
                ["Visão", "full-visao"],
                ["Semana", "full-semana"],
                ["Parcelas", "full-parcelas"],
                ["Lançar", "full-lancar"],
                ["Contas", "full-contas"],
                ["Gastos", "full-gastos"],
                ["Alertas", "full-alertas"],
                ["Cofrinhos", "full-cofrinhos"],
              ].map(([label, id]) => (
                <a key={id} href={`#${id}`} style={{ padding: "10px 12px", borderRadius: 10, textDecoration: "none", color: "#0f172a", background: "#f8fafc", border: "1px solid #e2e8f0" }}>{label}</a>
              ))}
            </div>

            <Section title="Visão Geral" id="full-visao">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Contas mensais" value={currency(totalSimulatedExpenses)} />
                <StatBox label="Você separa" value={currency(monthlyPlanContas)} />
                <StatBox label="Status" value={contasCoverage >= 100 ? "Seguro" : "Risco"} />
              </div>
            </Section>

            <Section title="Controle da Semana" id="full-semana">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Dias passados</div>
                  <input type="number" min="0" max="7" style={inputStyle()} value={data.daysPassed} onChange={(e) => update("daysPassed", Number(e.target.value))} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Gasto na semana</div>
                  <input type="number" min="0" style={inputStyle()} value={data.spentSoFar} onChange={(e) => update("spentSoFar", Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Limite semanal" value={currency(weeklyFlexible)} />
                <StatBox label="Limite por dia" value={currency(dailyLimit)} />
                <StatBox label="Ideal até agora" value={currency(idealSpent)} />
                <StatBox label="Diferença" value={currency(difference)} color={difference > 0 ? "#dc2626" : "#16a34a"} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, color: "#64748b" }}>Status da semana</span>
                <span style={{ padding: "6px 10px", borderRadius: 999, background: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>{weeklyStatus}</span>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>Disponível na semana (Vida diária + Diversão)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", marginTop: 6 }}>{currency(allowedToday)}</div>
                <div style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>Restante da semana: {currency(remainingWeek)}</div>
              </div>
            </Section>

            <Section title="Simulador de Parcelas" id="full-parcelas">
              <div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Nova parcela mensal</div>
                <input type="number" min="0" style={inputStyle()} value={data.simulatedInstallment} onChange={(e) => update("simulatedInstallment", Number(e.target.value))} />
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Contas mensais atuais" value={currency(totalFixedExpenses)} />
                <StatBox label="Nova parcela simulada" value={currency(data.simulatedInstallment)} />
                <StatBox label="Novo total de contas" value={currency(totalSimulatedExpenses)} />
                <StatBox label="Você separa por mês" value={currency(monthlyPlanContas)} />
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>Impacto da simulação</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>Cobertura das contas: {round2(contasCoverage).toFixed(1)}%</div>
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  {Number(data.simulatedInstallment) > 0
                    ? contasCoverage >= 100
                      ? "A nova parcela ainda cabe no plano atual."
                      : "A nova parcela quebra a cobertura das contas. Ajuste antes de comprar."
                    : "Digite um valor para testar uma compra parcelada antes de decidir."}
                </div>
              </div>
              {Number(data.simulatedInstallment) > 0 && contasCoverage < 100 && (
                <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: "#a16207" }}>Ajuste automático sugerido</div>
                  <div style={{ fontSize: 14 }}>Para a nova parcela caber, o sistema sugere subir <strong>Contas</strong> para {currency(suggestedWeeklyContas)} por semana.</div>
                  <div style={{ fontSize: 14 }}>Diferença necessária: <strong>{currency(contasShortfallWeekly)}</strong> por semana.</div>
                  <button style={buttonStyle(true)} onClick={applySuggestedContasAdjustment}>Ajustar automaticamente o plano</button>
                </div>
              )}
            </Section>

            <Section title="Adicionar lançamento" id="full-lancar">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Natureza</div>
                  <select style={inputStyle()} value={data.entryDraft.type} onChange={(e) => update("entryDraft.type", e.target.value)}>
                    <option value="expense">Gasto</option>
                    <option value="fixed">Conta Fixa</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}</div>
                  <input style={inputStyle()} value={data.entryDraft.name} onChange={(e) => update("entryDraft.name", e.target.value)} placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Valor</div>
                  <input type="number" min="0" style={inputStyle()} value={data.entryDraft.value} onChange={(e) => update("entryDraft.value", Number(e.target.value))} />
                </div>
              </div>
              <button style={{ ...buttonStyle(true), width: "100%" }} onClick={addEntry}>Adicionar lançamento</button>
            </Section>

            <Section title="Contas Fixas Detalhadas" id="full-contas">
              {data.fixedAccounts.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhuma conta fixa cadastrada.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {data.fixedAccounts.map((account) => (
                    <div key={account.id} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Nome da conta</div>
                        <input style={inputStyle()} value={account.name} onChange={(e) => updateFixedAccount(account.id, "name", e.target.value)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Valor mensal</div>
                        <div style={{ ...inputStyle(), display: "flex", alignItems: "center", background: "#f8fafc" }}>{currency(account.value)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Lançar gasto</div>
                        <input type="number" min="0" style={inputStyle()} value={account.spent} onChange={(e) => updateFixedAccount(account.id, "spent", Number(e.target.value))} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Total das contas fixas" value={currency(detailedFixedAccountsTotal)} />
                <StatBox label="Total de gastos lançados" value={currency(totalFixedAccountsSpent)} />
                <StatBox label="Restante das contas fixas" value={currency(totalFixedAccountsRemaining)} />
              </div>
            </Section>

            <Section title="Gastos Detalhados" id="full-gastos">
              {data.detailedExpenses.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhum gasto detalhado adicionado.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {data.detailedExpenses.map((expense) => (
                    <div key={expense.id} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Nome do gasto</div>
                        <input style={inputStyle()} value={expense.name} onChange={(e) => updateDetailedExpense(expense.id, "name", e.target.value)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Valor</div>
                        <input type="number" min="0" style={inputStyle()} value={expense.value} onChange={(e) => updateDetailedExpense(expense.id, "value", Number(e.target.value))} />
                      </div>
                      <div style={{ display: "flex", alignItems: "end" }}>
                        <button style={{ ...buttonStyle(false), width: "100%" }} onClick={() => removeDetailedExpense(expense.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Total dos gastos detalhados" value={currency(detailedExpensesTotal)} />
                <StatBox label="Gasto efetivo da semana" value={currency(effectiveSpentSoFar)} />
              </div>
            </Section>

            <Section title="Alertas Inteligentes dos Cofrinhos" id="full-alertas">
              <div style={{ display: "grid", gap: 10 }}>
                {intelligentAlerts.length === 0 ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: "#15803d" }}>Nenhum alerta crítico no momento</div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>Seus cofrinhos principais estão coerentes com o plano atual.</div>
                  </div>
                ) : (
                  intelligentAlerts.map((alert) => (
                    <div key={alert.title} style={{ borderRadius: 14, padding: 14, border: "1px solid #e2e8f0" }} className={`${alertBoxClass(alert.type)}`}>
                      <div className={alertTitleClass(alert.type)} style={{ fontWeight: 700 }}>{alert.title}</div>
                      <div style={{ fontSize: 14, marginTop: 6 }}>{alert.message}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Status do cofrinho de contas" value={contasPiggyStatus} />
                <StatBox label="Status do cofrinho de investimento" value={investimentoPiggyStatus} />
              </div>
            </Section>

            <Section title="Visão dos Cofrinhos" id="full-cofrinhos">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {Object.entries(data.piggyBanks).map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 14, color: "#64748b", textTransform: "capitalize" }}>{k}</div>
                      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#64748b" }}>
                        <input type="checkbox" checked={Boolean(data.piggyBankChecks?.[k])} onChange={(e) => update(`piggyBankChecks.${k}`, e.target.checked)} />
                        Atualizado
                      </label>
                    </div>
                    <input type="number" min="0" style={inputStyle()} value={v} onChange={(e) => update(`piggyBanks.${k}`, Number(e.target.value))} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <div style={{ fontWeight: 700 }}>{currency(v)}</div>
                      <div style={{ padding: "6px 10px", borderRadius: 999, background: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>{data.piggyBankChecks?.[k] ? "Conferido" : "Pendente"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Total em todos os cofrinhos" value={currency(totalPiggyBanks)} />
                <StatBox label="Falta para contas fecharem 1 mês" value={currency(Math.max(0, piggyContasGap))} color={piggyContasGap > 0 ? "#dc2626" : "#16a34a"} />
                <StatBox label="Meta mínima sugerida em investimento" value={currency(monthlyInvestment)} />
              </div>
            </Section>

            <Section title="Distribuição por Cofrinho" id="full-distribuicao">
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {Object.entries(distributionTargets).map(([key, item]) => (
                  <div key={key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 14, color: "#64748b", textTransform: "capitalize", marginBottom: 8 }}>{key}</div>
                    <div style={{ fontSize: 14 }}>Semanal: <strong style={{ color: "#16a34a" }}>{currency(item.weekly)}</strong></div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>Mensal: <strong>{currency(item.monthly)}</strong></div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>Saldo atual: <strong>{currency(item.current)}</strong></div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <StatBox label="Total da distribuição semanal" value={currency(distributionSummary.weekly)} />
                <StatBox label="Total da distribuição mensal" value={currency(distributionSummary.monthly)} />
              </div>
            </Section>

            <Section title="Investimento" id="full-investimento">
              <StatBox label="Você investe por mês" value={currency(monthlyInvestment)} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
