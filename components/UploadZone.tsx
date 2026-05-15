"use client";

import { useState, useRef, useCallback } from "react";
import { parseCSV } from "@/lib/csv";

interface Props {
  remainingCredits: number;
}

interface ColumnMap {
  first_name?: string;
  company?: string;
  role?: string;
  linkedin_url?: string;
  notes?: string;
}

type JobStatus = "idle" | "uploading" | "processing" | "done" | "error";

export default function UploadZone({ remainingCredits }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setError("");
    setDownloadUrl(null);
    setStatus("idle");
    const text = await f.text();
    const { rows, columnMap: cm } = parseCSV(text);
    setRowCount(rows.length);
    setColumnMap(cm);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped?.name.endsWith(".csv")) processFile(dropped);
    },
    [processFile]
  );

  async function handleProcess() {
    if (!file) return;
    setStatus("processing");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/process", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Processing failed");
      setStatus("error");
      return;
    }

    setProgress(rowCount);
    setStatus("done");
    setDownloadUrl(data.downloadUrl);
  }

  const insufficient = rowCount > remainingCredits;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          dragging
            ? "border-[#2A6B4A] bg-[#2A6B4A]/5"
            : "border-[#E8E8E2] hover:border-[#2A6B4A]/40 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <svg className="w-8 h-8 text-[#9A9A94] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {file ? (
          <p className="text-[#1A1A18] font-medium text-sm">{file.name}</p>
        ) : (
          <>
            <p className="text-[#1A1A18] font-medium text-sm">Drop your CSV here</p>
            <p className="text-[#9A9A94] text-xs mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Column detection */}
      {file && Object.keys(columnMap).length > 0 && (
        <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5">
          <p className="text-sm font-medium text-[#1A1A18] mb-3">Detected columns</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(columnMap).map(([field, col]) => (
              <span key={field} className="text-xs bg-[#2A6B4A]/10 text-[#2A6B4A] px-2.5 py-1 rounded-full">
                {field}: <em>{col}</em>
              </span>
            ))}
          </div>
          <p className="text-sm text-[#5A5A54] mt-3">
            <strong>{rowCount}</strong> rows detected &mdash; will use{" "}
            <strong>{rowCount}</strong> credit{rowCount !== 1 ? "s" : ""}
          </p>
          {insufficient && (
            <p className="text-sm text-red-500 mt-2">
              Not enough credits. You have {remainingCredits} remaining.
            </p>
          )}
        </div>
      )}

      {/* Progress */}
      {status === "processing" && (
        <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#2A6B4A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#1A1A18]">
              Generating opening lines for {rowCount} prospect{rowCount !== 1 ? "s" : ""}...
            </p>
          </div>
        </div>
      )}

      {/* Done */}
      {status === "done" && downloadUrl && (
        <div className="bg-[#2A6B4A]/5 border border-[#2A6B4A]/20 rounded-2xl p-5 flex items-center justify-between">
          <p className="text-sm text-[#2A6B4A] font-medium">
            Done! {rowCount} opening lines generated.
          </p>
          <a
            href={downloadUrl}
            download="coldcsv_output.csv"
            className="bg-[#2A6B4A] text-white px-4 py-2 rounded-pill text-sm font-medium hover:bg-[#235c3f] transition"
          >
            Download CSV
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Process button */}
      {file && status === "idle" && (
        <button
          onClick={handleProcess}
          disabled={insufficient || rowCount === 0}
          className="bg-[#1A1A18] text-white px-6 py-2.5 rounded-pill text-sm font-medium hover:bg-[#2A2A26] transition disabled:opacity-40"
        >
          Process CSV — {rowCount} credit{rowCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
