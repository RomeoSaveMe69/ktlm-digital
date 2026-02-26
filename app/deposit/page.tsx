"use client";

/**
 * User Deposit Page – 4-step recharge flow.
 * Step 1: Enter amount
 * Step 2: Select payment method (card UI)
 * Step 3: View payment details (account info or QR code)
 * Step 4: Enter transaction ID + upload screenshot → submit
 */

import { useCallback, useEffect, useRef, useState } from "react";

type PaymentMethod = {
  id: string;
  type: "account" | "qr";
  methodName: string;
  accountName: string | null;
  accountNumber: string | null;
  shopName: string | null;
  qrImage: string | null;
};

type DepositRecord = {
  id: string;
  amount: number;
  transactionId: string;
  status: string;
  methodName: string;
  createdAt: string;
};

const MAX_SS_SIZE = 300 * 1024;

const STEP_LABELS = [
  "Amount ရိုက်ထည့်ပါ",
  "Payment Method ရွေးပါ",
  "Payment Details",
  "Transaction ID & Screenshot",
];

export default function DepositPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [amount, setAmount] = useState("");

  // Step 2
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Step 4
  const [txId, setTxId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [ssError, setSsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // History
  const [history, setHistory] = useState<DepositRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const ssInputRef = useRef<HTMLInputElement>(null);

  const loadMethods = useCallback(async () => {
    setMethodsLoading(true);
    try {
      const res = await fetch("/api/payment-methods");
      const data = await res.json().catch(() => ({}));
      setMethods(data.methods ?? []);
    } catch {
      /* ignore */
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/deposit");
      const data = await res.json().catch(() => ({}));
      setHistory(data.deposits ?? []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Step 1 → 2
  const handleAmountNext = () => {
    const n = Number(amount);
    if (isNaN(n) || n < 1000) return;
    loadMethods();
    setStep(2);
  };

  // Step 2 → 3
  const handleSelectMethod = (m: PaymentMethod) => {
    setSelectedMethod(m);
    setStep(3);
  };

  // Step 3 → 4
  const handleProceed = () => setStep(4);

  // Screenshot upload
  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SS_SIZE) {
      setSsError("Screenshot သည် 300KB ထက် မကြီးရ။");
      e.target.value = "";
      return;
    }
    setSsError(null);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!txId.trim()) { setSubmitError("Transaction ID ဖြည့်ပါ။"); return; }
    if (!screenshot) { setSubmitError("Screenshot တင်ပါ။"); return; }
    if (!selectedMethod) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethodId: selectedMethod.id,
          transactionId: txId.trim(),
          screenshot,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSubmitError(data.error || "Submit failed."); return; }
      setSubmitSuccess(true);
      await loadHistory();
    } catch {
      setSubmitError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAmount("");
    setSelectedMethod(null);
    setTxId("");
    setScreenshot("");
    setSsError(null);
    setSubmitError(null);
    setSubmitSuccess(false);
    if (ssInputRef.current) ssInputRef.current.value = "";
  };

  const amountNum = Number(amount);
  const amountValid = !isNaN(amountNum) && amountNum >= 1000;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">Recharge / Deposit</h1>
            <p className="text-sm text-slate-500">ငွေဖြည့်ရန် အောက်ပါ အဆင့်များ လိုက်နာပါ</p>
          </div>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        {/* Step indicator */}
        {!submitSuccess && (
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={n} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}>
                    {done ? "✓" : n}
                  </div>
                  <span className={`truncate text-xs ${active ? "text-slate-200 font-medium" : "text-slate-500"}`}>
                    {label}
                  </span>
                  {n < 4 && <div className="h-px flex-1 bg-slate-700/60" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Success */}
        {submitSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-emerald-400">Request တင်ပြီးပါပြီ!</h2>
            <p className="text-slate-400 text-sm">
              Admin မှ စစ်ဆေးပြီး {amountNum.toLocaleString()} MMK ကို သင့် Wallet တွင် ထည့်ပေးမည်။
              ပုံမှန်ဆိုလျှင် မိနစ် ၁၅ ခန့် ကြာနိုင်သည်။
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              ထပ်မံ ငွေဖြည့်မည်
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Amount */}
            {step === 1 && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-5">
                <h2 className="font-semibold text-slate-200">ငွေပမာဏ ထည့်ပါ</h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">
                    Amount (MMK)
                    <span className="ml-2 text-xs text-slate-500">အနည်းဆုံး 1,000 MMK</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {amount && !amountValid && (
                    <p className="mt-1 text-xs text-red-400">အနည်းဆုံး 1,000 MMK ဖြည့်ပါ</p>
                  )}
                </div>
                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2">
                  {[5000, 10000, 20000, 50000, 100000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        amount === String(v)
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                          : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAmountNext}
                  disabled={!amountValid}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  ဆက်လက်ရန် →
                </button>
              </div>
            )}

            {/* Step 2: Select method */}
            {step === 2 && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200">Payment Method ရွေးပါ</h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    ← ပြန်
                  </button>
                </div>
                <p className="text-sm text-slate-400">
                  ငွေပမာဏ:{" "}
                  <span className="font-bold text-emerald-400">
                    {amountNum.toLocaleString()} MMK
                  </span>
                </p>
                {methodsLoading ? (
                  <p className="text-center text-slate-500 py-4">Loading...</p>
                ) : methods.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">
                    Payment Method မရှိသေးပါ။ Admin ကို ဆက်သွယ်ပါ။
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMethod(m)}
                        className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-800 p-4 text-left transition hover:border-emerald-500/50 hover:bg-slate-700/50"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-2xl">
                          {m.type === "qr" ? "📱" : "💳"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{m.methodName}</p>
                          <p className="text-xs text-slate-500">
                            {m.type === "qr" ? "MMQR Scan" : "Account Transfer"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment details */}
            {step === 3 && selectedMethod && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200">Payment Details</h2>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    ← ပြန်
                  </button>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <p className="text-sm text-amber-400 font-medium">
                    ငွေပမာဏ: {amountNum.toLocaleString()} MMK ကို အောက်ပါ Account သို့ လွှဲပေးပါ
                  </p>
                </div>

                {selectedMethod.type === "account" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500">Payment Method</p>
                        <p className="font-semibold text-slate-200">{selectedMethod.methodName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500">Account Name</p>
                        <p className="font-semibold text-slate-200">{selectedMethod.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500">Account Number</p>
                        <p className="font-bold text-lg text-emerald-400">
                          {selectedMethod.accountNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedMethod.accountNumber ?? "",
                          )
                        }
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3">
                      <p className="text-xs text-slate-500">Shop Name</p>
                      <p className="font-semibold text-slate-200">{selectedMethod.shopName}</p>
                    </div>
                    {selectedMethod.qrImage && (
                      <div className="flex justify-center rounded-xl border border-slate-600 bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedMethod.qrImage}
                          alt="QR Code"
                          className="h-52 w-52 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  ငွေလွှဲပြီးပါပြီ → ဆက်လက်ရန်
                </button>
              </div>
            )}

            {/* Step 4: TxID + Screenshot */}
            {step === 4 && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200">
                    Transaction ID & Screenshot တင်ပါ
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    ← ပြန်
                  </button>
                </div>

                {submitError && (
                  <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
                    {submitError}
                  </p>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">
                    Transaction ID
                    <span className="ml-1 text-xs text-slate-500">(နောက်ဆုံး ၆ လုံး)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-400">
                    Screenshot
                    <span className="ml-1 text-xs text-slate-500">(Max 300KB)</span>
                  </label>
                  <input
                    ref={ssInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshot}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600/80 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-emerald-500"
                  />
                  {ssError && (
                    <p className="mt-1 text-xs text-red-400">{ssError}</p>
                  )}
                  {screenshot && !ssError && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-600">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshot}
                        alt="Screenshot preview"
                        className="max-h-48 w-full object-contain bg-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-semibold text-emerald-400">
                      {amountNum.toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method</span>
                    <span className="text-slate-300">{selectedMethod?.methodName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Request တင်မည်"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Deposit History */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Deposit History
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
            {historyLoading ? (
              <div className="py-8 text-center text-slate-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                Deposit မရှိသေးပါ။
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/80 bg-slate-800/80">
                      <th className="px-4 py-3 font-medium text-slate-400">Amount</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Method</th>
                      <th className="px-4 py-3 font-medium text-slate-400">TxID</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-slate-700/40 hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {d.amount.toLocaleString()} MMK
                        </td>
                        <td className="px-4 py-3 text-slate-400">{d.methodName}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{d.transactionId}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            d.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : d.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
