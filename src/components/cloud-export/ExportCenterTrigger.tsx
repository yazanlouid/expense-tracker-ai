"use client";

interface ExportCenterTriggerProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ExportCenterTrigger({ onClick, disabled }: ExportCenterTriggerProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M5.5 16a4.5 4.5 0 01-.5-8.98 5.5 5.5 0 0110.62-1.63A4 4 0 0116 13.9v.1H5.5v-.02A.5.5 0 015.5 16z" />
        <path d="M10.75 9.75a.75.75 0 00-1.5 0v3.19l-.72-.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l2-2a.75.75 0 10-1.06-1.06l-.72.72V9.75z" />
      </svg>
      Export Center
    </button>
  );
}
