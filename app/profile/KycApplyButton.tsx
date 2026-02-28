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
        className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 py-3 px-4 text-center font-medium text-emerald-400 transition hover:bg-emerald-500/20"
      >
        Apply to be a Seller
      </button>
      {showModal && <KycApplyModal onClose={() => setShowModal(false)} />}
    </>
  );
}
