"use client";

import { ADMIN_LABELS } from "@/constants/ui";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-gray-50"
    >
      {ADMIN_LABELS.printButton}
    </button>
  );
}
