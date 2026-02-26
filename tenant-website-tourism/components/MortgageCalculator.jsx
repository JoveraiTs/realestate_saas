"use client";

import { useMemo, useState } from "react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const calcMortgage = ({ principal, annualRatePct, months }) => {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Number(months) || 1);
  const annual = Math.max(0, Number(annualRatePct) || 0);
  const r = annual / 100 / 12;

  if (r === 0) {
    const payment = P / n;
    const totalPayment = payment * n;
    return { payment, totalPayment, totalInterest: totalPayment - P };
  }

  const pow = Math.pow(1 + r, n);
  const payment = (P * r * pow) / (pow - 1);
  const totalPayment = payment * n;
  return { payment, totalPayment, totalInterest: totalPayment - P };
};

const formatMoney = (value, currency) => {
  const number = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "AED",
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `${Math.round(number)}`;
  }
};

export default function MortgageCalculator({ currency = "AED" }) {
  const [principal, setPrincipal] = useState(100000);
  const [periodMode, setPeriodMode] = useState("months");
  const [periodValue, setPeriodValue] = useState(12);
  const [annualRatePct, setAnnualRatePct] = useState(4);

  const months = useMemo(() => {
    if (periodMode === "years") {
      return clamp(Number(periodValue) * 12, 12, 480);
    }
    return clamp(Number(periodValue), 12, 480);
  }, [periodMode, periodValue]);

  const result = useMemo(() => calcMortgage({ principal, annualRatePct, months }), [principal, annualRatePct, months]);

  const onReset = () => {
    setPrincipal(100000);
    setPeriodMode("months");
    setPeriodValue(12);
    setAnnualRatePct(4);
  };

  return (
    <section className="sp-mortgage">
      <h2 className="sp-mortgage-title">Calculator Mortgage</h2>
      <button type="button" className="sp-mortgage-reset" onClick={onReset}>Reset</button>

      <div className="sp-mortgage-grid">
        <div className="sp-mortgage-card">
          <div className="sp-mortgage-row">
            <label className="sp-mortgage-label">Amount</label>
            <input
              className="sp-mortgage-input"
              value={principal}
              onChange={(e) => setPrincipal(clamp(Number(e.target.value || 0), 0, 100000000))}
              inputMode="numeric"
            />
          </div>
          <input
            className="sp-mortgage-range"
            type="range"
            min="0"
            max="1000000"
            step="1000"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
          />

          <div className="sp-mortgage-row" style={{ marginTop: 14 }}>
            <label className="sp-mortgage-label">Payment Period</label>
            <input
              className="sp-mortgage-input"
              value={periodValue}
              onChange={(e) => setPeriodValue(clamp(Number(e.target.value || 0), 1, 480))}
              inputMode="numeric"
            />
          </div>

          <div className="sp-mortgage-toggle">
            <label>
              <input type="radio" name="period" checked={periodMode === "months"} onChange={() => setPeriodMode("months")} />
              <span>Month</span>
            </label>
            <label>
              <input type="radio" name="period" checked={periodMode === "years"} onChange={() => setPeriodMode("years")} />
              <span>Year</span>
            </label>
          </div>

          <div className="sp-mortgage-row" style={{ marginTop: 14 }}>
            <label className="sp-mortgage-label">Annual interest Rate</label>
            <input
              className="sp-mortgage-input"
              value={annualRatePct}
              onChange={(e) => setAnnualRatePct(clamp(Number(e.target.value || 0), 0, 25))}
              inputMode="decimal"
            />
          </div>
          <input
            className="sp-mortgage-range"
            type="range"
            min="0"
            max="25"
            step="0.25"
            value={annualRatePct}
            onChange={(e) => setAnnualRatePct(Number(e.target.value))}
          />

          <p className="sp-mortgage-hint">{months} months total</p>
        </div>

        <div className="sp-mortgage-card sp-mortgage-summary">
          <p className="sp-mortgage-summary-label">Monthly Payment</p>
          <p className="sp-mortgage-summary-value">{formatMoney(result.payment, currency)}</p>

          <div className="sp-mortgage-summary-grid">
            <div>
              <p className="sp-mortgage-mini-label">Total Interest</p>
              <p className="sp-mortgage-mini-value">{formatMoney(result.totalInterest, currency)}</p>
            </div>
            <div>
              <p className="sp-mortgage-mini-label">Total Payment</p>
              <p className="sp-mortgage-mini-value">{formatMoney(result.totalPayment, currency)}</p>
            </div>
          </div>

          <button type="button" className="sp-mortgage-apply">Apply Now</button>
        </div>
      </div>
    </section>
  );
}
