import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "controle_financeiro_marciel_v21";
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
    value: "",
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

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const styles = {
  page: {
    background: "#f8fafc",
    minHeight: "100vh",
    padding: 16,
    paddingBottom: 90,
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 16,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
  },
  title: {
    margin: "0 0 14px 0",
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    width: "100%",
    minHeight: 42,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  buttonPrimary: {
    minHeight: 42,
    borderRadius: 10,
    padding: "10px 14px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  buttonSecondary: {
    minHeight: 42,
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  stat: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
  },
  pill: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#e2e8f0",
    fontSize: 12,
    fontWeight: 700,
  },
  rowCard: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },
  nav: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
  navLink: {
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#0f172a",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 14,
  },
};

function Section(props) {
  return (
    <section id={props.id} style={styles.card}>
      <h2 style={styles.title}>{props.title}</h2>
      <div style={{ display: "grid", gap: 14 }}>{props.children}</div>
    </section>
  );
}

function Field(props) {
  return (
    <div>
      <div style={styles.label}>{props.label}</div>
      {props.children}
    </div>
  );
}

function Stat(props) {
  return (
    <div style={styles.stat}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{props.label}</div>
      <div style={{ fontWeight: 700, fontSize: 20, color: props.color || "#0f172a" }}>{props.value}</div>
    </div>
  );
}

export default function ControleFinanceiroMarciel() {
  const [data, setData] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(function () {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData({
          ...defaultState,
          ...parsed,
          weeklyPlan: { ...defaultState.weeklyPlan, ...(parsed.weeklyPlan || {}) },
          piggyBanks: { ...defaultState.piggyBanks, ...(parsed.piggyBanks || {}) },
          piggyBankChecks: { ...defaultState.piggyBankChecks, ...(parsed.piggyBankChecks || {}) },
          fixedAccounts: Array.isArray(parsed.fixedAccounts) ? parsed.fixedAccounts : defaultState.fixedAccounts,
          detailedExpenses: Array.isArray(parsed.detailedExpenses) ? parsed.detailedExpenses : [],
          entryDraft: { ...defaultState.entryDraft, ...(parsed.entryDraft || {}) },
        });
      }
    } catch (error) {
      console.error("Falha ao carregar dados salvos:", error);
      setData(defaultState);
    }
    setLoaded(true);
  }, []);

  useEffect(function () {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Falha ao salvar dados:", error);
    }
  }, [data, loaded]);

  function update(path, value) {
    setData(function (prev) {
      const next = deepClone(prev);
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function addEntry() {
    const name = String(data.entryDraft.name || "").trim();
    const value = Number(data.entryDraft.value || 0);
    if (!name || value <= 0) return;

    if (data.entryDraft.type === "fixed") {
      setData(function (prev) {
        return {
          ...prev,
          fixedAccounts: prev.fixedAccounts.concat([{ id: Date.now(), name: name, value: value, spent: 0 }]),
          entryDraft: { ...prev.entryDraft, name: "", value: "" },
        };
      });
      return;
    }

    setData(function (prev) {
      return {
        ...prev,
        detailedExpenses: prev.detailedExpenses.concat([{ id: Date.now(), name: name, value: value }]),
        entryDraft: { ...prev.entryDraft, name: "", value: "" },
      };
    });
  }

  function updateFixedAccount(id, field, value) {
    setData(function (prev) {
      return {
        ...prev,
        fixedAccounts: prev.fixedAccounts.map(function (item) {
          return item.id === id ? { ...item, [field]: value } : item;
        }),
      };
    });
  }

  function updateDetailedExpense(id, field, value) {
    setData(function (prev) {
      return {
        ...prev,
        detailedExpenses: prev.detailedExpenses.map(function (item) {
          return item.id === id ? { ...item, [field]: value } : item;
        }),
      };
    });
  }

  function removeDetailedExpense(id) {
    setData(function (prev) {
      return {
        ...prev,
        detailedExpenses: prev.detailedExpenses.filter(function (item) {
          return item.id !== id;
        }),
      };
    });
  }

  function applySuggestedContasAdjustment() {
    const neededWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
    const currentWeeklyContas = Number(data.weeklyPlan.contas || 0);
    const delta = round2(neededWeeklyContas - currentWeeklyContas);
    if (delta <= 0) return;

    setData(function (prev) {
      const next = deepClone(prev);
      next.weeklyPlan.contas = neededWeeklyContas;
      let remaining = delta;
      const adjustableFields = ["diversao", "seguranca", "vida", "saude"];
      adjustableFields.forEach(function (field) {
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

  const fixedAccounts = Array.isArray(data.fixedAccounts) ? data.fixedAccounts : [];
  const detailedExpenses = Array.isArray(data.detailedExpenses) ? data.detailedExpenses : [];
  const piggyBanks = data.piggyBanks && typeof data.piggyBanks === "object" ? data.piggyBanks : {};
  const piggyBankChecks = data.piggyBankChecks && typeof data.piggyBankChecks === "object" ? data.piggyBankChecks : {};

  const detailedExpensesTotal = detailedExpenses.reduce(function (sum, item) {
    return sum + Number(item.value || 0);
  }, 0);
  const detailedFixedAccountsTotal = fixedAccounts.reduce(function (sum, item) {
    return sum + Number(item.value || 0);
  }, 0);
  const totalFixedAccountsSpent = fixedAccounts.reduce(function (sum, item) {
    return sum + Number(item.spent || 0);
  }, 0);
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
  const totalPiggyBanks = Object.values(piggyBanks).reduce(function (sum, value) {
    return sum + Number(value || 0);
  }, 0);
  const recommendedContasBuffer = round2(totalSimulatedExpenses * 0.2);
  const piggyContasGap = round2(totalSimulatedExpenses - Number(piggyBanks.contas || 0));
  const piggyInvestimentoMonthlyGap = round2(monthlyInvestment - Number(piggyBanks.investimento || 0));

  const contasPiggyStatus = Number(piggyBanks.contas || 0) >= totalSimulatedExpenses ? "Coberto" : Number(piggyBanks.contas || 0) >= totalSimulatedExpenses * 0.7 ? "Atenção" : "Crítico";
  const investimentoPiggyStatus = Number(piggyBanks.investimento || 0) >= monthlyInvestment * 3 ? "Forte" : Number(piggyBanks.investimento || 0) >= monthlyInvestment ? "Ok" : "Fraco";

  const intelligentAlerts = useMemo(function () {
    return [
      Number(piggyBanks.contas || 0) < totalSimulatedExpenses
        ? {
            title: "Cofrinho de contas abaixo do necessário",
            message: "Faltam " + formatCurrency(Math.max(0, piggyContasGap)) + " para cobrir 1 mês completo de contas.",
          }
        : null,
      Number(piggyBanks.investimento || 0) < monthlyInvestment
        ? {
            title: "Cofrinho de investimento fraco para o ritmo atual",
            message: "Ele está " + formatCurrency(Math.max(0, piggyInvestimentoMonthlyGap)) + " abaixo de 1 mês do seu próprio aporte planejado.",
          }
        : null,
    ].filter(Boolean);
  }, [piggyBanks, totalSimulatedExpenses, piggyContasGap, monthlyInvestment, piggyInvestimentoMonthlyGap]);

  const distributionTargets = {
    contas: { weekly: Number(data.weeklyPlan.contas || 0), monthly: round2(Number(data.weeklyPlan.contas || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.contas || 0) },
    saude: { weekly: Number(data.weeklyPlan.saude || 0), monthly: round2(Number(data.weeklyPlan.saude || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.saude || 0) },
    investimento: { weekly: Number(data.weeklyPlan.investimento || 0), monthly: round2(Number(data.weeklyPlan.investimento || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.investimento || 0) },
    vida: { weekly: Number(data.weeklyPlan.vida || 0), monthly: round2(Number(data.weeklyPlan.vida || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.vida || 0) },
    diversao: { weekly: Number(data.weeklyPlan.diversao || 0), monthly: round2(Number(data.weeklyPlan.diversao || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.diversao || 0) },
    seguranca: { weekly: Number(data.weeklyPlan.seguranca || 0), monthly: round2(Number(data.weeklyPlan.seguranca || 0) * WEEKS_PER_MONTH), current: Number(piggyBanks.seguranca || 0) },
  };

  const distributionSummary = Object.values(distributionTargets).reduce(function (acc, item) {
    acc.weekly += item.weekly;
    acc.monthly += item.monthly;
    return acc;
  }, { weekly: 0, monthly: 0 });

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={styles.subtitle}>Controle Financeiro</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Marciel</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={data.mode === "quick" ? styles.buttonPrimary : styles.buttonSecondary} onClick={function () { update("mode", "quick"); }}>Rápido</button>
            <button style={data.mode === "full" ? styles.buttonPrimary : styles.buttonSecondary} onClick={function () { update("mode", "full"); }}>Completo</button>
          </div>
        </div>

        {data.mode === "quick" ? (
          <>
            <Section title="Lançamento rápido" id="quick-top">
              <div style={styles.grid}>
                <Field label="Natureza">
                  <select style={styles.input} value={data.entryDraft.type} onChange={function (e) { update("entryDraft.type", e.target.value); }}>
                    <option value="expense">Gasto</option>
                    <option value="fixed">Conta Fixa</option>
                  </select>
                </Field>
                <Field label={data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}>
                  <input style={styles.input} value={data.entryDraft.name} onChange={function (e) { update("entryDraft.name", e.target.value); }} placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"} />
                </Field>
                <Field label="Valor">
                  <input type="number" min="0" style={styles.input} value={data.entryDraft.value} onChange={function (e) { update("entryDraft.value", e.target.value); }} />
                </Field>
              </div>
              <button style={{ ...styles.buttonPrimary, width: "100%" }} onClick={addEntry}>Salvar lançamento</button>
            </Section>

            <Section title="Resumo rápido">
              <div style={styles.grid}>
                <Stat label="Gasto total detalhado" value={formatCurrency(detailedExpensesTotal)} color="#dc2626" />
                <Stat label="Gasto efetivo da semana" value={formatCurrency(effectiveSpentSoFar)} />
                <Stat label="Disponível hoje" value={formatCurrency(allowedToday)} color="#2563eb" />
              </div>
            </Section>

            <Section title="Gastos recentes" id="quick-gastos">
              {detailedExpenses.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhum gasto ainda.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {detailedExpenses.slice(-10).reverse().map(function (expense) {
                    return (
                      <div key={expense.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                        <div style={{ fontWeight: 500 }}>{expense.name}</div>
                        <div style={{ fontWeight: 700, color: "#dc2626" }}>{formatCurrency(expense.value)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </>
        ) : (
          <>
            <div style={{ ...styles.card, ...styles.nav }}>
              {[["Visão", "full-visao"],["Semana", "full-semana"],["Parcelas", "full-parcelas"],["Lançar", "full-lancar"],["Contas", "full-contas"],["Gastos", "full-gastos"],["Alertas", "full-alertas"],["Cofrinhos", "full-cofrinhos"]].map(function (pair) {
                return <a key={pair[1]} href={"#" + pair[1]} style={styles.navLink}>{pair[0]}</a>;
              })}
            </div>

            <Section title="Visão Geral" id="full-visao">
              <div style={styles.grid}>
                <Stat label="Contas mensais" value={formatCurrency(totalSimulatedExpenses)} />
                <Stat label="Você separa" value={formatCurrency(monthlyPlanContas)} />
                <Stat label="Status" value={contasCoverage >= 100 ? "Seguro" : "Risco"} />
              </div>
            </Section>

            <Section title="Controle da Semana" id="full-semana">
              <div style={styles.grid}>
                <Field label="Dias passados">
                  <input type="number" min="0" max="7" style={styles.input} value={data.daysPassed} onChange={function (e) { update("daysPassed", Number(e.target.value)); }} />
                </Field>
                <Field label="Gasto na semana">
                  <input type="number" min="0" style={styles.input} value={data.spentSoFar} onChange={function (e) { update("spentSoFar", Number(e.target.value)); }} />
                </Field>
              </div>
              <div style={styles.grid}>
                <Stat label="Limite semanal" value={formatCurrency(weeklyFlexible)} />
                <Stat label="Limite por dia" value={formatCurrency(dailyLimit)} />
                <Stat label="Ideal até agora" value={formatCurrency(idealSpent)} />
                <Stat label="Diferença" value={formatCurrency(difference)} color={difference > 0 ? "#dc2626" : "#16a34a"} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, color: "#64748b" }}>Status da semana</span>
                <span style={styles.pill}>{weeklyStatus}</span>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>Disponível na semana (Vida diária + Diversão)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", marginTop: 6 }}>{formatCurrency(allowedToday)}</div>
                <div style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>Restante da semana: {formatCurrency(remainingWeek)}</div>
              </div>
            </Section>

            <Section title="Simulador de Parcelas" id="full-parcelas">
              <Field label="Nova parcela mensal">
                <input type="number" min="0" style={styles.input} value={data.simulatedInstallment} onChange={function (e) { update("simulatedInstallment", Number(e.target.value)); }} />
              </Field>
              <div style={styles.grid}>
                <Stat label="Contas mensais atuais" value={formatCurrency(totalFixedExpenses)} />
                <Stat label="Nova parcela simulada" value={formatCurrency(data.simulatedInstallment)} />
                <Stat label="Novo total de contas" value={formatCurrency(totalSimulatedExpenses)} />
                <Stat label="Você separa por mês" value={formatCurrency(monthlyPlanContas)} />
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
              {Number(data.simulatedInstallment) > 0 && contasCoverage < 100 ? (
                <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: "#a16207" }}>Ajuste automático sugerido</div>
                  <div style={{ fontSize: 14 }}>Para a nova parcela caber, o sistema sugere subir <strong>Contas</strong> para {formatCurrency(suggestedWeeklyContas)} por semana.</div>
                  <div style={{ fontSize: 14 }}>Diferença necessária: <strong>{formatCurrency(contasShortfallWeekly)}</strong> por semana.</div>
                  <button style={styles.buttonPrimary} onClick={applySuggestedContasAdjustment}>Ajustar automaticamente o plano</button>
                </div>
              ) : null}
            </Section>

            <Section title="Adicionar lançamento" id="full-lancar">
              <div style={styles.grid}>
                <Field label="Natureza">
                  <select style={styles.input} value={data.entryDraft.type} onChange={function (e) { update("entryDraft.type", e.target.value); }}>
                    <option value="expense">Gasto</option>
                    <option value="fixed">Conta Fixa</option>
                  </select>
                </Field>
                <Field label={data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}>
                  <input style={styles.input} value={data.entryDraft.name} onChange={function (e) { update("entryDraft.name", e.target.value); }} placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Café"} />
                </Field>
                <Field label="Valor">
                  <input type="number" min="0" style={styles.input} value={data.entryDraft.value} onChange={function (e) { update("entryDraft.value", e.target.value); }} />
                </Field>
              </div>
              <button style={{ ...styles.buttonPrimary, width: "100%" }} onClick={addEntry}>Adicionar lançamento</button>
            </Section>

            <Section title="Contas Fixas Detalhadas" id="full-contas">
              {fixedAccounts.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhuma conta fixa cadastrada.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {fixedAccounts.map(function (account) {
                    return (
                      <div key={account.id} style={styles.rowCard}>
                        <Field label="Nome da conta">
                          <input style={styles.input} value={account.name} onChange={function (e) { updateFixedAccount(account.id, "name", e.target.value); }} />
                        </Field>
                        <Field label="Valor mensal">
                          <div style={{ ...styles.input, display: "flex", alignItems: "center", background: "#f8fafc" }}>{formatCurrency(account.value)}</div>
                        </Field>
                        <Field label="Lançar gasto">
                          <input type="number" min="0" style={styles.input} value={account.spent} onChange={function (e) { updateFixedAccount(account.id, "spent", Number(e.target.value)); }} />
                        </Field>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={styles.grid}>
                <Stat label="Total das contas fixas" value={formatCurrency(detailedFixedAccountsTotal)} />
                <Stat label="Total de gastos lançados" value={formatCurrency(totalFixedAccountsSpent)} />
                <Stat label="Restante das contas fixas" value={formatCurrency(totalFixedAccountsRemaining)} />
              </div>
            </Section>

            <Section title="Gastos Detalhados" id="full-gastos">
              {detailedExpenses.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Nenhum gasto detalhado adicionado.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {detailedExpenses.map(function (expense) {
                    return (
                      <div key={expense.id} style={styles.rowCard}>
                        <Field label="Nome do gasto">
                          <input style={styles.input} value={expense.name} onChange={function (e) { updateDetailedExpense(expense.id, "name", e.target.value); }} />
                        </Field>
                        <Field label="Valor">
                          <input type="number" min="0" style={styles.input} value={expense.value} onChange={function (e) { updateDetailedExpense(expense.id, "value", Number(e.target.value)); }} />
                        </Field>
                        <div style={{ display: "flex", alignItems: "end" }}>
                          <button style={{ ...styles.buttonSecondary, width: "100%" }} onClick={function () { removeDetailedExpense(expense.id); }}>Remover</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={styles.grid}>
                <Stat label="Total dos gastos detalhados" value={formatCurrency(detailedExpensesTotal)} />
                <Stat label="Gasto efetivo da semana" value={formatCurrency(effectiveSpentSoFar)} />
              </div>
            </Section>

            <Section title="Alertas Inteligentes dos Cofrinhos" id="full-alertas">
              {intelligentAlerts.length === 0 ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: "#15803d" }}>Nenhum alerta crítico no momento</div>
                  <div style={{ fontSize: 14, marginTop: 6 }}>Seus cofrinhos principais estão coerentes com o plano atual.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {intelligentAlerts.map(function (alert) {
                    return (
                      <div key={alert.title} style={{ borderRadius: 14, padding: 14, border: "1px solid #e2e8f0", background: "#fff7ed" }}>
                        <div style={{ fontWeight: 700 }}>{alert.title}</div>
                        <div style={{ fontSize: 14, marginTop: 6 }}>{alert.message}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={styles.grid}>
                <Stat label="Status do cofrinho de contas" value={contasPiggyStatus} />
                <Stat label="Status do cofrinho de investimento" value={investimentoPiggyStatus} />
              </div>
            </Section>

            <Section title="Visão dos Cofrinhos" id="full-cofrinhos">
              <div style={styles.grid}>
                {Object.keys(piggyBanks).map(function (k) {
                  var v = piggyBanks[k];
                  return (
                    <div key={k} style={styles.stat}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontSize: 14, color: "#64748b", textTransform: "capitalize" }}>{k}</div>
                        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#64748b" }}>
                          <input type="checkbox" checked={Boolean(piggyBankChecks[k])} onChange={function (e) { update("piggyBankChecks." + k, e.target.checked); }} />
                          Atualizado
                        </label>
                      </div>
                      <input type="number" min="0" style={styles.input} value={v} onChange={function (e) { update("piggyBanks." + k, Number(e.target.value)); }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(v)}</div>
                        <div style={styles.pill}>{piggyBankChecks[k] ? "Conferido" : "Pendente"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={styles.grid}>
                <Stat label="Total em todos os cofrinhos" value={formatCurrency(totalPiggyBanks)} />
                <Stat label="Falta para contas fecharem 1 mês" value={formatCurrency(Math.max(0, piggyContasGap))} color={piggyContasGap > 0 ? "#dc2626" : "#16a34a"} />
                <Stat label="Meta mínima sugerida em investimento" value={formatCurrency(monthlyInvestment)} />
              </div>
            </Section>

            <Section title="Distribuição por Cofrinho" id="full-distribuicao">
              <div style={styles.grid}>
                {Object.keys(distributionTargets).map(function (key) {
                  var item = distributionTargets[key];
                  return (
                    <div key={key} style={styles.stat}>
                      <div style={{ fontSize: 14, color: "#64748b", textTransform: "capitalize", marginBottom: 8 }}>{key}</div>
                      <div style={{ fontSize: 14 }}>Semanal: <strong style={{ color: "#16a34a" }}>{formatCurrency(item.weekly)}</strong></div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Mensal: <strong>{formatCurrency(item.monthly)}</strong></div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Saldo atual: <strong>{formatCurrency(item.current)}</strong></div>
                    </div>
                  );
                })}
              </div>
              <div style={styles.grid}>
                <Stat label="Total da distribuição semanal" value={formatCurrency(distributionSummary.weekly)} />
                <Stat label="Total da distribuição mensal" value={formatCurrency(distributionSummary.monthly)} />
              </div>
            </Section>

            <Section title="Investimento" id="full-investimento">
              <Stat label="Você investe por mês" value={formatCurrency(monthlyInvestment)} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
