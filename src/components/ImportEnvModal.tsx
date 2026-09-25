import React, { useState } from 'react';
import { FileUp, Upload, Check, AlertCircle, X, Shield, FileText } from 'lucide-react';

interface ImportEnvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (envContent: string, overwrite: boolean) => Promise<{ added: number; updated: number }>;
  environmentName: string;
}

export const ImportEnvModal: React.FC<ImportEnvModalProps> = ({
  isOpen,
  onClose,
  onImport,
  environmentName,
}) => {
  const [content, setContent] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const parsedVariables = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const eq = line.indexOf('=');
      const k = line.slice(0, eq).trim().toUpperCase();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return { key: k, value: v };
    })
    .filter((item) => /^[A-Z_][A-Z0-9_]*$/.test(item.key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide .env file content or upload a file.');
      return;
    }
    if (parsedVariables.length === 0) {
      setError('No valid KEY=VALUE pairs detected in the provided content.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onImport(content, overwrite);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.12] bg-[#111624] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Import .env File
            </h3>
            <p className="text-xs text-slate-400">
              Bulk encrypt into <span className="font-mono text-cyan-300 capitalize">{environmentName}</span> environment
            </p>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-white/[0.1] hover:border-white/[0.2] bg-black/30'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.env,.env.*,text/plain';
            input.onchange = (e: any) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            };
            input.click();
          }}
        >
          <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-slate-200">
            Drag & drop a <span className="font-mono text-cyan-300">.env</span> file here, or click to browse
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Accepts standard .env files with KEY=VALUE syntax
          </div>
        </div>

        <div className="my-3 flex items-center justify-center space-x-2 text-[11px] text-slate-500 uppercase tracking-wider">
          <div className="h-[1px] w-12 bg-white/[0.08]" />
          <span>Or Paste Content</span>
          <div className="h-[1px] w-12 bg-white/[0.08]" />
        </div>

        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`# Paste .env contents here\nDATABASE_URL=postgresql://user:pass@localhost:5432/app\nSTRIPE_SECRET=sk_test_1234567890\nCACHE_TTL=3600`}
          className="w-full rounded-xl border border-white/[0.1] bg-black/50 p-3 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
        />

        {/* Live Parsed Preview */}
        {parsedVariables.length > 0 && (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/40 p-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
              <span>Preview: {parsedVariables.length} variables detected</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Will encrypt locally
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
              {parsedVariables.slice(0, 8).map((pv) => (
                <div key={pv.key} className="flex justify-between text-slate-400 truncate">
                  <span className="text-slate-200 font-medium">{pv.key}</span>
                  <span className="text-slate-500 truncate max-w-[200px]">••••••••</span>
                </div>
              ))}
              {parsedVariables.length > 8 && (
                <div className="text-slate-500 italic text-[10px]">
                  + {parsedVariables.length - 8} more variables...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="mt-3 flex items-center space-x-2">
          <input
            type="checkbox"
            id="overwrite"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="rounded border-white/[0.2] bg-black/50 text-indigo-500 focus:ring-0"
          />
          <label htmlFor="overwrite" className="text-xs text-slate-300 select-none">
            Overwrite existing keys if already defined in {environmentName}
          </label>
        </div>

        {error && (
          <div className="mt-3 flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/[0.08] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || parsedVariables.length === 0}
            className="flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            <span>
              {isSubmitting
                ? 'Encrypting & Importing...'
                : `Encrypt & Import (${parsedVariables.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
