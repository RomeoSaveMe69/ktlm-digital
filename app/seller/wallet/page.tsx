"use client";

import { useCallback, useEffect, useState } from "react";

export default function SellerWalletPage() {
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [balance, setBalance] = useState(0);
  const [withdrawPending, setWithdrawPending] = useState(0);
  const [loading, setLoading] = useState(true);

  // Exchange form
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchanging, setExchanging] = useState(false);
  const [exchangeMsg, setExchangeMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountName, setAccountName] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/overview");
      const data = await res.json();
      if (res.ok && data.stats) {
        setWithdrawableBalance(data.stats.withdrawableBalance ?? 0);
        setBalance(data.stats.balance ?? 0);
        setWithdrawPending(data.stats.withdrawPendingBalance ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setExchangeMsg(null);
    const amount = Number(exchangeAmount);
    if (!amount || amount <= 0) {
      setExchangeMsg({ type: "error", text: "Please enter a valid amount." });
      return;
    }
    if (amount > withdrawableBalance) {
      setExchangeMsg({
        type: "error",
        text: "Amount exceeds Total Sale Money.",
      });
      return;
    }
    setExchanging(true);
    try {
      const res = await fetch("/api/seller/wallet/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setExchangeMsg({ type: "success", text: "Exchange successful!" });
        setWithdrawableBalance(data.withdrawableBalance);
        setBalance(data.balance);
        setExchangeAmount("");
      } else {
        setExchangeMsg({
          type: "error",
          text: data.error || "Exchange failed.",
        });
      }
    } catch {
      setExchangeMsg({ type: "error", text: "Network error." });
    } finally {
      setExchanging(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawMsg({ type: "error", text: "Please enter a valid amount." });
      return;
    }
    if (amount > withdrawableBalance) {
      setWithdrawMsg({
        type: "error",
        text: "Amount exceeds Total Sale Money.",
      });
      return;
    }
    if (!paymentMethod.trim()) {
      setWithdrawMsg({
        type: "error",
        text: "Payment method is required.",
      });
      return;
    }
    if (!accountName.trim()) {
      setWithdrawMsg({ type: "error", text: "Account name is required." });
      return;
    }
    if (!paymentNumber.trim()) {
      setWithdrawMsg({ type: "error", text: "Payment number is required." });
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/seller/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: paymentMethod.trim(),
          accountName: accountName.trim(),
          paymentNumber: paymentNumber.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawMsg({
          type: "success",
          text: "Withdrawal request submitted! Admin approval required.",
        });
        setWithdrawableBalance(data.withdrawableBalance);
        setWithdrawPending(data.withdrawPendingBalance);
        setWithdrawAmount("");
        setPaymentMethod("");
        setAccountName("");
        setPaymentNumber("");
      } else {
        setWithdrawMsg({
          type: "error",
          text: data.error || "Withdrawal failed.",
        });
      }
    } catch {
      setWithdrawMsg({ type: "error", text: "Network error." });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading wallet...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Wallet</h2>
        <p className="text-sm text-slate-500">
          ငွေလွှဲပြောင်းခြင်း နှင့် ငွေထုတ်ယူခြင်း
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5">
          <p className="text-sm text-slate-400">Total Sale Money</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {withdrawableBalance.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">MMK</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-5">
          <p className="text-sm text-slate-400">Balance</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            {balance.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">MMK</p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-5">
          <p className="text-sm text-slate-400">Withdraw Pending</p>
          <p className="mt-1 text-2xl font-bold text-violet-400">
            {withdrawPending.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">MMK</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exchange Form */}
        <form
          onSubmit={handleExchange}
          className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-800/50 p-6"
        >
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Exchange to Balance
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Total Sale Money → Balance (ဝယ်ယူရန် သုံးနိုင်)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Amount (MMK)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Available: {withdrawableBalance.toLocaleString()} MMK
            </p>
          </div>

          {exchangeMsg && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                exchangeMsg.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {exchangeMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={exchanging}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {exchanging ? "Exchanging..." : "Exchange"}
          </button>
        </form>

        {/* Withdraw Form */}
        <form
          onSubmit={handleWithdraw}
          className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-800/50 p-6"
        >
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Withdraw
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Total Sale Money → ငွေထုတ်ယူရန် (Admin Approval လိုအပ်)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Amount (MMK)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Available: {withdrawableBalance.toLocaleString()} MMK
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Payment Method
            </label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g. KBZPay, WavePay, CB Bank"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. account holder name"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Payment Number
            </label>
            <input
              type="text"
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(e.target.value)}
              placeholder="e.g. 09XXXXXXXX"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {withdrawMsg && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                withdrawMsg.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {withdrawMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={withdrawing}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {withdrawing ? "Submitting..." : "Submit Withdrawal"}
          </button>
        </form>
      </div>
    </div>
  );
}
