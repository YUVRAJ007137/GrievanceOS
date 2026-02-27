"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
        copied
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border bg-surface text-gray-400 hover:border-border-light hover:text-white"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
