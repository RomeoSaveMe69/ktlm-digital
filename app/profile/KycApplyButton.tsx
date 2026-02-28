"use client";

import { useState } from "react";
import { KycApplyModal } from "./KycApplyModal";

export function KycApplyButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-sm text-slate-500 hover:text-emerald-400 transition underline underline-offset-2"
      >
        Want to sell? Apply to be a Seller →
      </button>
      {showModal && <KycApplyModal onClose={() => setShowModal(false)} />}
    </>
  );
}
