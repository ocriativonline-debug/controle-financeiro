import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "controle_financeiro_marciel_vite_v1";
const WEEKS_PER_MONTH = 4.33;

const defaultState = {
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
    type: "fixed",
    name: "",
    value: 0,
  },
  extraAccounts: [],
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
  if (type === "critical") return "alert-critical";
  if (type === "warning") return "alert-warning";
  if (type === "success") return "alert-success";
  return "alert-info";
}

function alertTitleClass(type) {
  if (type === "critical") return "alert-title-critical";
  if (type === "warning") return "alert-title-warning";
  if (type === "success") return "alert-title-success";
  return "alert-title-info";
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function NumberInput({ value, onChange, min = 0, max, placeholder }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value))}
      className="input"
    />
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="input"
    />
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

export default function App() {
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
          weeklyPlan: {
            ...defaultState.weeklyPlan,
            ...(parsed.weeklyPlan || {}),
          },
          piggyBanks: {
            ...defaultState.piggyBanks,
            ...(parsed.piggyBanks || {}),
          },
          piggyBankChecks: {
            ...defaultState.piggyBankChecks,
            ...(parsed.piggyBankChecks || {}),
          },
          fixedAccounts:
            Array.isArray(parsed.fixedAccounts) && parsed.fixedAccounts.length > 0
              ? parsed.fixedAccounts
              : defaultState.fixedAccounts,
          detailedExpenses: Array.isArray(parsed.detailedExpenses)
            ? parsed.detailedExpenses
            : [],
          entryDraft: {
            ...defaultState.entryDraft,
            ...(parsed.entryDraft || {}),
          },
          extraAccounts: Array.isArray(parsed.extraAccounts)
            ? parsed.extraAccounts
            : [],
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
      const clone = deepClone(prev);
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
        fixedAccounts: [
          ...prev.fixedAccounts,
          { id: Date.now(), name, value, spent: 0 },
        ],
        entryDraft: { ...prev.entryDraft, name: "", value: 0 },
      }));
      return;
    }

    setData((prev) => ({
      ...prev,
      detailedExpenses: [
        ...prev.detailedExpenses,
        { id: Date.now(), name, value },
      ],
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

  function updateExtraAccount(id, field, value) {
    setData((prev) => ({
      ...prev,
      extraAccounts: prev.extraAccounts.map((account) =>
        account.id === id ? { ...account, [field]: value } : account
      ),
    }));
  }

  function removeExtraAccount(id) {
    setData((prev) => ({
      ...prev,
      extraAccounts: prev.extraAccounts.filter((account) => account.id !== id),
    }));
  }

  function addExtraAccount() {
    setData((prev) => ({
      ...prev,
      extraAccounts: [
        ...prev.extraAccounts,
        { id: Date.now(), name: "Nova conta", value: 0 },
      ],
    }));
  }

  const detailedExpensesTotal = data.detailedExpenses.reduce(
    (sum, expense) => sum + Number(expense.value || 0),
    0
  );

  const extraAccountsTotal = data.extraAccounts.reduce(
    (sum, account) => sum + Number(account.value || 0),
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

  const totalFixedAccountsRemaining = Math.max(
    0,
    detailedFixedAccountsTotal - totalFixedAccountsSpent
  );

  const weeklyFlexible =
    Number(data.weeklyPlan.vida || 0) + Number(data.weeklyPlan.diversao || 0);

  const effectiveSpentSoFar =
    Number(data.spentSoFar || 0) + Number(detailedExpensesTotal || 0);

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

  const totalFixedExpenses = detailedFixedAccountsTotal + extraAccountsTotal;
  const monthlyPlanContas = Number(data.weeklyPlan.contas || 0) * WEEKS_PER_MONTH;
  const totalSimulatedExpenses =
    totalFixedExpenses + Number(data.simulatedInstallment || 0);

  const contasCoverage =
    totalSimulatedExpenses > 0
      ? (monthlyPlanContas / totalSimulatedExpenses) * 100
      : 100;

  const suggestedWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
  const contasShortfallWeekly = round2(
    Math.max(0, suggestedWeeklyContas - Number(data.weeklyPlan.contas || 0))
  );

  const monthlyInvestment =
    Number(data.weeklyPlan.investimento || 0) * WEEKS_PER_MONTH;

  const totalPiggyBanks = Object.values(data.piggyBanks || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const recommendedContasBuffer = round2(totalSimulatedExpenses * 0.2);
  const piggyContasGap = round2(
    totalSimulatedExpenses - Number(data.piggyBanks.contas || 0)
  );
  const piggyInvestimentoMonthlyGap = round2(
    monthlyInvestment - Number(data.piggyBanks.investimento || 0)
  );

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
            type:
              Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses * 0.7
                ? "critical"
                : "warning",
            title: "Cofrinho de contas abaixo do necessário",
            message: `Faltam ${currency(
              Math.max(0, piggyContasGap)
            )} para cobrir 1 mês completo de contas.`,
          }
        : null,
      Number(data.piggyBanks.contas || 0) >= totalSimulatedExpenses &&
      Number(data.piggyBanks.contas || 0) < totalSimulatedExpenses + recommendedContasBuffer
        ? {
            type: "info",
            title: "Cofrinho de contas coberto, mas sem folga",
            message: `Seu colchão ideal para contas seria pelo menos ${currency(
              recommendedContasBuffer
            )} além do valor mensal.`,
          }
        : null,
      Number(data.piggyBanks.investimento || 0) < monthlyInvestment
        ? {
            type: "warning",
            title: "Cofrinho de investimento fraco para o ritmo atual",
            message: `Ele está ${currency(
              Math.max(0, piggyInvestimentoMonthlyGap)
            )} abaixo de 1 mês do seu próprio aporte planejado.`,
          }
        : null,
      Number(data.piggyBanks.investimento || 0) >= monthlyInvestment * 3
        ? {
            type: "success",
            title: "Cofrinho de investimento em nível saudável",
            message:
              "Você já acumulou pelo menos 3 meses do seu aporte mensal planejado.",
          }
        : null,
      Number(data.piggyBanks.saude || 0) < 200
        ? {
            type: "warning",
            title: "Cofrinho de saúde apertado",
            message:
              "Se surgir consulta ou remédio, você pode acabar puxando dinheiro da vida diária ou das contas.",
          }
        : null,
      Number(data.piggyBanks.diversao || 0) === 0
        ? {
            type: "info",
            title: "Cofrinho de diversão zerado",
            message:
              "Tudo bem se for intencional. Se não for, o risco é compensar na vida diária.",
          }
        : null,
    ].filter(Boolean);
  }, [
    data.piggyBanks,
    totalSimulatedExpenses,
    piggyContasGap,
    recommendedContasBuffer,
    monthlyInvestment,
    piggyInvestimentoMonthlyGap,
  ]);

  function applySuggestedContasAdjustment() {
    const neededWeeklyContas = round2(totalSimulatedExpenses / WEEKS_PER_MONTH);
    const currentWeeklyContas = Number(data.weeklyPlan.contas || 0);
    const delta = round2(neededWeeklyContas - currentWeeklyContas);
    if (delta <= 0) return;

    setData((prev) => {
      const clone = deepClone(prev);
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
        clone.weeklyPlan.investimento = round2(
          Math.max(0, Number(clone.weeklyPlan.investimento || 0) - remaining)
        );
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
    <div className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <div>
            <p className="eyebrow">Controle financeiro</p>
            <h1>Marciel</h1>
          </div>
        </header>

        <SectionCard title="Visão Geral">
          <div className="stats-grid">
            <div className="stat-box">
              <span>Contas mensais</span>
              <strong>{currency(totalSimulatedExpenses)}</strong>
            </div>
            <div className="stat-box">
              <span>Você separa</span>
              <strong>{currency(monthlyPlanContas)}</strong>
            </div>
            <div className="stat-box">
              <span>Status</span>
              <strong>{contasCoverage >= 100 ? "Seguro" : "Risco"}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Controle da Semana">
          <div className="form-grid two">
            <div className="field">
              <LabelText>Dias passados</LabelText>
              <NumberInput
                min={0}
                max={7}
                value={data.daysPassed}
                onChange={(value) => update("daysPassed", value)}
              />
            </div>

            <div className="field">
              <LabelText>Gasto na semana</LabelText>
              <NumberInput
                min={0}
                value={data.spentSoFar}
                onChange={(value) => update("spentSoFar", value)}
              />
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Limite semanal</span>
              <strong>{currency(weeklyFlexible)}</strong>
            </div>
            <div className="stat-box">
              <span>Limite por dia</span>
              <strong>{currency(dailyLimit)}</strong>
            </div>
            <div className="stat-box">
              <span>Ideal até agora</span>
              <strong>{currency(idealSpent)}</strong>
            </div>
            <div className="stat-box">
              <span>Diferença</span>
              <strong className={difference > 0 ? "negative" : "positive"}>
                {currency(difference)}
              </strong>
            </div>
          </div>

          <div className="status-row">
            <span>Status da semana</span>
            <BadgeText>{weeklyStatus}</BadgeText>
          </div>

          <div className="highlight-box">
            <span>Disponível na semana (Vida diária + Diversão)</span>
            <strong>{currency(allowedToday)}</strong>
            <small>Restante da semana: {currency(remainingWeek)}</small>
          </div>
        </SectionCard>

        <SectionCard title="Simulador de Parcelas">
          <div className="field">
            <LabelText>Nova parcela mensal</LabelText>
            <NumberInput
              min={0}
              value={data.simulatedInstallment}
              onChange={(value) => update("simulatedInstallment", value)}
            />
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Contas mensais atuais</span>
              <strong>{currency(totalFixedExpenses)}</strong>
            </div>
            <div className="stat-box">
              <span>Nova parcela simulada</span>
              <strong>{currency(data.simulatedInstallment)}</strong>
            </div>
            <div className="stat-box">
              <span>Novo total de contas</span>
              <strong>{currency(totalSimulatedExpenses)}</strong>
            </div>
            <div className="stat-box">
              <span>Você separa por mês</span>
              <strong>{currency(monthlyPlanContas)}</strong>
            </div>
          </div>

          <div className="note-box">
            <p>
              <strong>Impacto da simulação:</strong> cobertura das contas{" "}
              {round2(contasCoverage).toFixed(1)}%
            </p>
            <p>
              {Number(data.simulatedInstallment) > 0
                ? contasCoverage >= 100
                  ? "A nova parcela ainda cabe no plano atual."
                  : "A nova parcela quebra a cobertura das contas. Ajuste antes de comprar."
                : "Digite um valor para testar uma compra parcelada antes de decidir."}
            </p>
          </div>

          {Number(data.simulatedInstallment) > 0 && contasCoverage < 100 && (
            <div className="warning-box">
              <p>
                Para a nova parcela caber, o sistema sugere subir <strong>Contas</strong>{" "}
                para {currency(suggestedWeeklyContas)} por semana.
              </p>
              <p>
                Diferença necessária: <strong>{currency(contasShortfallWeekly)}</strong>{" "}
                por semana.
              </p>
              <button className="btn" onClick={applySuggestedContasAdjustment}>
                Ajustar automaticamente o plano
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Contas Fixas Detalhadas">
          <details className="details-block" open>
            <summary>Clique para expandir suas contas fixas e lançar gastos</summary>
            <div className="details-content">
              {data.fixedAccounts.map((account) => (
                <div key={account.id} className="row-card">
                  <div className="field">
                    <LabelText>Nome da conta</LabelText>
                    <TextInput
                      value={account.name}
                      onChange={(value) => updateFixedAccount(account.id, "name", value)}
                      placeholder="Ex.: Academia"
                    />
                  </div>
                  <div className="field">
                    <LabelText>Valor mensal</LabelText>
                    <div className="readonly-box">{currency(account.value)}</div>
                  </div>
                  <div className="field">
                    <LabelText>Lançar gasto</LabelText>
                    <NumberInput
                      min={0}
                      value={account.spent}
                      onChange={(value) => updateFixedAccount(account.id, "spent", value)}
                      placeholder="Ex.: 208,95"
                    />
                  </div>
                </div>
              ))}

              <div className="stats-grid">
                <div className="stat-box">
                  <span>Total das contas fixas</span>
                  <strong>{currency(detailedFixedAccountsTotal)}</strong>
                </div>
                <div className="stat-box">
                  <span>Total de gastos lançados</span>
                  <strong>{currency(totalFixedAccountsSpent)}</strong>
                </div>
                <div className="stat-box">
                  <span>Restante das contas fixas</span>
                  <strong>{currency(totalFixedAccountsRemaining)}</strong>
                </div>
              </div>
            </div>
          </details>
        </SectionCard>

        <SectionCard title="Contas Extras">
          <div className="form-grid three">
            <div className="field">
              <LabelText>Natureza</LabelText>
              <select
                className="input"
                value={data.entryDraft.type}
                onChange={(e) => update("entryDraft.type", e.target.value)}
              >
                <option value="fixed">Conta Fixa</option>
                <option value="expense">Gasto</option>
              </select>
            </div>

            <div className="field">
              <LabelText>
                {data.entryDraft.type === "fixed" ? "Nome da conta" : "Nome do gasto"}
              </LabelText>
              <TextInput
                value={data.entryDraft.name}
                onChange={(value) => update("entryDraft.name", value)}
                placeholder={data.entryDraft.type === "fixed" ? "Ex.: Internet" : "Ex.: Lanche"}
              />
            </div>

            <div className="field">
              <LabelText>Valor</LabelText>
              <NumberInput
                min={0}
                value={data.entryDraft.value}
                onChange={(value) => update("entryDraft.value", value)}
              />
            </div>
          </div>

          <button className="btn" onClick={addEntry}>
            Adicionar lançamento
          </button>

          <div className="note-box">
            <p>
              Se você escolher <strong>Conta Fixa</strong>, o item entra em{" "}
              <strong>Contas Fixas Detalhadas</strong>. Se escolher <strong>Gasto</strong>,
              ele entra em <strong>Gastos Detalhados</strong> e passa a compor o gasto
              efetivo da semana.
            </p>
          </div>

          <div className="inline-list">
            <button className="btn btn-secondary" onClick={addExtraAccount}>
              Adicionar conta extra manual
            </button>
          </div>

          {data.extraAccounts.length > 0 && (
            <div className="stack">
              {data.extraAccounts.map((account) => (
                <div key={account.id} className="row-card compact">
                  <div className="field">
                    <LabelText>Nome da conta</LabelText>
                    <TextInput
                      value={account.name}
                      onChange={(value) => updateExtraAccount(account.id, "name", value)}
                    />
                  </div>
                  <div className="field">
                    <LabelText>Valor mensal</LabelText>
                    <NumberInput
                      min={0}
                      value={account.value}
                      onChange={(value) => updateExtraAccount(account.id, "value", value)}
                    />
                  </div>
                  <div className="field">
                    <LabelText>&nbsp;</LabelText>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeExtraAccount(account.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}

              <div className="stat-box">
                <span>Total das contas extras</span>
                <strong>{currency(extraAccountsTotal)}</strong>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Gastos Detalhados">
          <details className="details-block" open>
            <summary>Clique para expandir seus gastos detalhados</summary>
            <div className="details-content">
              {data.detailedExpenses.length === 0 ? (
                <p className="muted">Nenhum gasto detalhado adicionado.</p>
              ) : (
                data.detailedExpenses.map((expense) => (
                  <div key={expense.id} className="row-card compact">
                    <div className="field">
                      <LabelText>Nome do gasto</LabelText>
                      <TextInput
                        value={expense.name}
                        onChange={(value) =>
                          updateDetailedExpense(expense.id, "name", value)
                        }
                      />
                    </div>
                    <div className="field">
                      <LabelText>Valor</LabelText>
                      <NumberInput
                        min={0}
                        value={expense.value}
                        onChange={(value) =>
                          updateDetailedExpense(expense.id, "value", value)
                        }
                      />
                    </div>
                    <div className="field">
                      <LabelText>&nbsp;</LabelText>
                      <button
                        className="btn btn-danger"
                        onClick={() => removeDetailedExpense(expense.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="stats-grid">
                <div className="stat-box">
                  <span>Total dos gastos detalhados</span>
                  <strong>{currency(detailedExpensesTotal)}</strong>
                </div>
                <div className="stat-box">
                  <span>Gasto efetivo da semana</span>
                  <strong>{currency(effectiveSpentSoFar)}</strong>
                </div>
              </div>
            </div>
          </details>
        </SectionCard>

        <SectionCard title="Alertas Inteligentes dos Cofrinhos">
          <div className="stack">
            {intelligentAlerts.length === 0 ? (
              <div className="alert-box alert-success">
                <p className="alert-title-success">Nenhum alerta crítico no momento</p>
                <p>Seus cofrinhos principais estão coerentes com o plano atual.</p>
              </div>
            ) : (
              intelligentAlerts.map((alert) => (
                <div key={alert.title} className={`alert-box ${alertBoxClass(alert.type)}`}>
                  <p className={alertTitleClass(alert.type)}>{alert.title}</p>
                  <p>{alert.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Status do cofrinho de contas</span>
              <strong>{contasPiggyStatus}</strong>
            </div>
            <div className="stat-box">
              <span>Status do cofrinho de investimento</span>
              <strong>{investimentoPiggyStatus}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Visão dos Cofrinhos">
          <div className="piggy-grid">
            {Object.entries(data.piggyBanks).map(([key, value]) => (
              <div key={key} className="piggy-card">
                <div className="piggy-top">
                  <span className="capitalize">{key}</span>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={Boolean(data.piggyBankChecks?.[key])}
                      onChange={(e) =>
                        update(`piggyBankChecks.${key}`, e.target.checked)
                      }
                    />
                    Atualizado
                  </label>
                </div>

                <NumberInput
                  min={0}
                  value={value}
                  onChange={(newValue) => update(`piggyBanks.${key}`, newValue)}
                />

                <div className="piggy-bottom">
                  <strong>{currency(value)}</strong>
                  <BadgeText>
                    {data.piggyBankChecks?.[key] ? "Conferido" : "Pendente"}
                  </BadgeText>
                </div>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Total em todos os cofrinhos</span>
              <strong>{currency(totalPiggyBanks)}</strong>
            </div>
            <div className="stat-box">
              <span>Falta para contas fecharem 1 mês</span>
              <strong className={piggyContasGap > 0 ? "negative" : "positive"}>
                {currency(Math.max(0, piggyContasGap))}
              </strong>
            </div>
            <div className="stat-box">
              <span>Meta mínima sugerida em investimento</span>
              <strong>{currency(monthlyInvestment)}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Distribuição por Cofrinho">
          <div className="stats-grid">
            {Object.entries(distributionTargets).map(([key, item]) => (
              <div key={key} className="stat-box">
                <span className="capitalize">{key}</span>
                <p>
                  Semanal: <strong className="positive">{currency(item.weekly)}</strong>
                </p>
                <p>Mensal: <strong>{currency(item.monthly)}</strong></p>
                <p>Saldo atual: <strong>{currency(item.current)}</strong></p>
              </div>
            ))}
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Total da distribuição semanal</span>
              <strong>{currency(distributionSummary.weekly)}</strong>
            </div>
            <div className="stat-box">
              <span>Total da distribuição mensal</span>
              <strong>{currency(distributionSummary.monthly)}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Investimento">
          <div className="stat-box">
            <span>Você investe por mês</span>
            <strong>{currency(monthlyInvestment)}</strong>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function LabelText({ children }) {
  return <label className="label">{children}</label>;
}

function BadgeText({ children }) {
  return <span className="badge">{children}</span>;
}