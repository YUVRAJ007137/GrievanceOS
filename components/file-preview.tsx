"use client";

import { useState } from "react";

function getFileType(url: string): "image" | "pdf" | "other" {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(lower)) return "image";
  if (/\.pdf(\?|$)/.test(lower)) return "pdf";
  return "other";
}

function getFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").pop() || "file";
    return name.replace(/^\d+-[a-z0-9]+\./, "file.");
  } catch {
    return "file";
  }
}

export function FileAttachment({ url, label }: { url: string; label?: string }) {
  const type = getFileType(url);
  const name = label || getFileName(url);

  return (
    <div className="mt-2 rounded-xl border border-border bg-surface-raised p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">
          {type === "image" ? "🖼" : type === "pdf" ? "📄" : "📎"}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:text-accent-500 truncate"
        >
          {name}
        </a>
        <a
          href={url}
          download
          className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
        >
          Download
        </a>
      </div>
    </div>
  );
}

export function FilePreview({ url }: { url: string }) {
  const type = getFileType(url);
  const [expanded, setExpanded] = useState(false);

  if (type === "image") {
    return (
      <div className="mt-2">
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-accent hover:text-accent-500 font-medium mb-1">
          {expanded ? "Hide preview" : "Show preview"}
        </button>
        {expanded && (
          <div className="rounded-xl border border-border overflow-hidden bg-surface-raised">
            <img src={url} alt="Attachment" className="max-w-full max-h-96 object-contain mx-auto" />
          </div>
        )}
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="mt-2">
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-accent hover:text-accent-500 font-medium mb-1">
          {expanded ? "Hide preview" : "Preview PDF"}
        </button>
        {expanded && (
          <div className="rounded-xl border border-border overflow-hidden bg-surface-raised">
            <iframe src={url} className="w-full h-[500px]" title="PDF preview" />
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function FileUploadInput({
  onFileSelected,
  uploading,
}: {
  onFileSelected: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        Attach file (optional)
      </label>
      <div className="relative">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
          disabled={uploading}
          className="input file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20 file:cursor-pointer disabled:opacity-40"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        {uploading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            Uploading…
          </span>
        )}
      </div>
    </div>
  );
}
