import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode, Plus, Trash2, Edit2, Sliders, Info, Eye, EyeOff } from 'lucide-react';
import { DecryptedSecret } from '../types';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  templateType: 'env' | 'yaml' | 'json' | 'tfvars' | 'kubernetes' | 'custom';
  customFormat?: string; // e.g. "export {{KEY}}={{VALUE}}"
}

interface ExportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  secrets: DecryptedSecret[];
  projectName: string;
  environmentName: string;
}

const DEFAULT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'tpl-env',
    name: '.env Standard',
    description: 'Traditional KEY=VALUE layout for local development environments.',
    fileExtension: 'env',
    templateType: 'env'
  },
  {
    id: 'tpl-yaml',
    name: 'YAML Config',
    description: 'Structured key-value format commonly used in Docker-Compose, Rails, and Node configurations.',
    fileExtension: 'yaml',
    templateType: 'yaml'
  },
  {
    id: 'tpl-tfvars',
    name: 'Terraform tfvars',
    description: 'Declarative variable assignments for deploying secure cloud infrastructure via Terraform.',
    fileExtension: 'tfvars',
    templateType: 'tfvars'
  },
  {
    id: 'tpl-k8s',
    name: 'Kubernetes Secret',
    description: 'Fully formatted declarative Kubernetes secret manifest (v1 Secret with stringData).',
    fileExtension: 'yaml',
    templateType: 'kubernetes'
  },
  {
    id: 'tpl-json',
    name: 'JSON Key-Value',
    description: 'Standard key-value dictionary compatible with serverless environments or custom scripts.',
    fileExtension: 'json',
    templateType: 'json'
  }
];

export const ExportTemplateModal: React.FC<ExportTemplateModalProps> = ({
  isOpen,
  onClose,
  secrets,
  projectName,
  environmentName
}) => {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-env');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [revealSecrets, setRevealSecrets] = useState(false);

  // New custom template inputs
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplExt, setNewTplExt] = useState('sh');
  const [newTplFormat, setNewTplFormat] = useState('export {{KEY}}="{{VALUE}}"');
  const [newTplDesc, setNewTplDesc] = useState('Custom shell scripts or system profiles');

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('confidant_export_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  if (!isOpen) return null;

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const saveCustomTemplate = () => {
    if (!newTplName.trim()) return;
    const newTpl: ExportTemplate = {
      id: 'tpl-custom-' + Date.now(),
      name: newTplName,
      description: newTplDesc || 'Custom user defined export format',
      fileExtension: newTplExt || 'txt',
      templateType: 'custom',
      customFormat: newTplFormat
    };

    const localSavedOnly = templates.filter(t => t.id.startsWith('tpl-custom-'));
    const updatedCustoms = [...localSavedOnly, newTpl];
    localStorage.setItem('confidant_export_templates', JSON.stringify(updatedCustoms));

    setTemplates([...DEFAULT_TEMPLATES, ...updatedCustoms]);
    setSelectedTemplateId(newTpl.id);
    setIsCreatingCustom(false);

    // Reset inputs
    setNewTplName('');
    setNewTplExt('sh');
    setNewTplFormat('export {{KEY}}="{{VALUE}}"');
    setNewTplDesc('');
  };

  const deleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id.startsWith('tpl-custom-')) return;
    const updatedCustoms = templates
      .filter(t => t.id.startsWith('tpl-custom-') && t.id !== id)
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        fileExtension: t.fileExtension,
        templateType: t.templateType,
        customFormat: t.customFormat
      }));

    localStorage.setItem('confidant_export_templates', JSON.stringify(updatedCustoms));
    setTemplates([...DEFAULT_TEMPLATES, ...updatedCustoms]);
    if (selectedTemplateId === id) {
      setSelectedTemplateId('tpl-env');
    }
  };

  const renderContent = (): string => {
    const getVal = (sec: DecryptedSecret) => {
      if (revealSecrets) {
        return sec.value || '';
      }
      return '••••••••••••••••';
    };

    switch (activeTemplate.templateType) {
      case 'yaml':
        return secrets
          .map(s => `${s.key.toLowerCase()}: "${getVal(s).replace(/"/g, '\\"')}"`)
          .join('\n');

      case 'tfvars':
        return secrets
          .map(s => `${s.key.toLowerCase()} = "${getVal(s).replace(/"/g, '\\"')}"`)
          .join('\n');

      case 'json': {
        const obj: Record<string, string> = {};
        secrets.forEach(s => {
          obj[s.key] = getVal(s);
        });
        return JSON.stringify(obj, null, 2);
      }

      case 'kubernetes': {
        const space = '    ';
        const lines = [
          'apiVersion: v1',
          'kind: Secret',
          'metadata:',
          `  name: ${projectName.toLowerCase().replace(/\s+/g, '-')}-${environmentName}-secrets`,
          'type: Opaque',
          'stringData:'
        ];
        secrets.forEach(s => {
          lines.push(`${space}${s.key}: "${getVal(s).replace(/"/g, '\\"')}"`);
        });
        return lines.join('\n');
      }

      case 'custom': {
        const formatStr = activeTemplate.customFormat || 'export {{KEY}}="{{VALUE}}"';
        return secrets
          .map(s => {
            return formatStr
              .replace(/\{\{KEY\}\}/g, s.key)
              .replace(/\{\{key\}\}/g, s.key.toLowerCase())
              .replace(/\{\{VALUE\}\}/g, getVal(s))
              .replace(/\{\{value\}\}/g, getVal(s));
          })
          .join('\n');
      }

      case 'env':
      default:
        return secrets.map(s => `${s.key}="${getVal(s).replace(/"/g, '\\"')}"`).join('\n');
    }
  };

  const generatedText = renderContent();

  const handleCopy = async () => {
    try {
      // Always copy actual secret values rather than masking dots if they are trying to copy
      const actualValReveal = revealSecrets;
      let finalToCopy = generatedText;
      if (!actualValReveal) {
        // Compute plaintext version for copying
        const backupReveal = revealSecrets;
        setRevealSecrets(true);
        // Force evaluation with plaintext
        const plaintextRenderer = () => {
          switch (activeTemplate.templateType) {
            case 'yaml':
              return secrets.map(s => `${s.key.toLowerCase()}: "${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
            case 'tfvars':
              return secrets.map(s => `${s.key.toLowerCase()} = "${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
            case 'json': {
              const obj: Record<string, string> = {};
              secrets.forEach(s => { obj[s.key] = s.value || ''; });
              return JSON.stringify(obj, null, 2);
            }
            case 'kubernetes': {
              const lines = [
                'apiVersion: v1',
                'kind: Secret',
                'metadata:',
                `  name: ${projectName.toLowerCase().replace(/\s+/g, '-')}-${environmentName}-secrets`,
                'type: Opaque',
                'stringData:'
              ];
              secrets.forEach(s => { lines.push(`    ${s.key}: "${(s.value || '').replace(/"/g, '\\"')}"`); });
              return lines.join('\n');
            }
            case 'custom': {
              const formatStr = activeTemplate.customFormat || 'export {{KEY}}="{{VALUE}}"';
              return secrets.map(s => formatStr.replace(/\{\{KEY\}\}/g, s.key).replace(/\{\{key\}\}/g, s.key.toLowerCase()).replace(/\{\{VALUE\}\}/g, s.value || '').replace(/\{\{value\}\}/g, s.value || '')).join('\n');
            }
            default:
              return secrets.map(s => `${s.key}="${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
          }
        };
        finalToCopy = plaintextRenderer();
      }
      await navigator.clipboard.writeText(finalToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      alert('Failed to copy text to clipboard');
    }
  };

  const handleDownload = () => {
    try {
      // Compute actual plaintext version to export
      const plaintextRenderer = () => {
        switch (activeTemplate.templateType) {
          case 'yaml':
            return secrets.map(s => `${s.key.toLowerCase()}: "${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
          case 'tfvars':
            return secrets.map(s => `${s.key.toLowerCase()} = "${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
          case 'json': {
            const obj: Record<string, string> = {};
            secrets.forEach(s => { obj[s.key] = s.value || ''; });
            return JSON.stringify(obj, null, 2);
          }
          case 'kubernetes': {
            const lines = [
              'apiVersion: v1',
              'kind: Secret',
              'metadata:',
              `  name: ${projectName.toLowerCase().replace(/\s+/g, '-')}-${environmentName}-secrets`,
              'type: Opaque',
              'stringData:'
            ];
            secrets.forEach(s => { lines.push(`    ${s.key}: "${(s.value || '').replace(/"/g, '\\"')}"`); });
            return lines.join('\n');
          }
          case 'custom': {
            const formatStr = activeTemplate.customFormat || 'export {{KEY}}="{{VALUE}}"';
            return secrets.map(s => formatStr.replace(/\{\{KEY\}\}/g, s.key).replace(/\{\{key\}\}/g, s.key.toLowerCase()).replace(/\{\{VALUE\}\}/g, s.value || '').replace(/\{\{value\}\}/g, s.value || '')).join('\n');
          }
          default:
            return secrets.map(s => `${s.key}="${(s.value || '').replace(/"/g, '\\"')}"`).join('\n');
        }
      };

      const finalPlaintext = plaintextRenderer();
      const blob = new Blob([finalPlaintext], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${environmentName}.${activeTemplate.fileExtension}`;
      a.click();
      URL.revokeObjectURL(url);

      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);
    } catch (e) {
      alert('Download failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-white/[0.12] bg-[#0f1322] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] my-4 animate-in zoom-in-95 duration-150">
        
        {/* Left column: Templates catalog */}
        <div className="w-full md:w-80 border-r border-white/[0.08] bg-black/20 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="h-4.5 w-4.5 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Export Formats</span>
            </div>
            {!isCreatingCustom && (
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all"
                title="Create custom template"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List or Custom Form */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isCreatingCustom ? (
              <div className="p-3 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                  <span>New Template</span>
                  <button onClick={() => setIsCreatingCustom(false)} className="text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Template Name</label>
                  <input
                    type="text"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder="e.g., Python Config"
                    className="w-full text-xs p-2 rounded-lg bg-black border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">File Extension</label>
                  <input
                    type="text"
                    value={newTplExt}
                    onChange={(e) => setNewTplExt(e.target.value)}
                    placeholder="e.g., py"
                    className="w-full text-xs p-2 rounded-lg bg-black border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Format Syntax</label>
                    <span className="text-[9px] text-indigo-400">Use &#123;&#123;KEY&#125;&#125; & &#123;&#123;VALUE&#125;&#125;</span>
                  </div>
                  <textarea
                    rows={3}
                    value={newTplFormat}
                    onChange={(e) => setNewTplFormat(e.target.value)}
                    placeholder='e.g., settings["{{KEY}}"] = "{{VALUE}}"'
                    className="w-full text-xs p-2 rounded-lg bg-black border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Description</label>
                  <input
                    type="text"
                    value={newTplDesc}
                    onChange={(e) => setNewTplDesc(e.target.value)}
                    placeholder="Brief format purpose..."
                    className="w-full text-xs p-2 rounded-lg bg-black border border-white/[0.1] text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveCustomTemplate}
                  disabled={!newTplName.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Save to Library
                </button>
              </div>
            ) : (
              templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{tpl.name}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] font-mono bg-white/[0.08] text-slate-400 px-1 py-0.5 rounded">
                          .{tpl.fileExtension}
                        </span>
                        {tpl.id.startsWith('tpl-custom-') && (
                          <button
                            onClick={(e) => deleteCustomTemplate(tpl.id, e)}
                            className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Code Viewer & Actions */}
        <div className="flex-1 flex flex-col h-full bg-[#0b0d17]">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Template Preview
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {projectName} / <span className="text-cyan-400 font-semibold">{environmentName}</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRevealSecrets(!revealSecrets)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-white/[0.06]"
              >
                {revealSecrets ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Mask Secrets</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal Secrets</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 text-xs text-slate-200 hover:text-white transition-colors bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Plaintext!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 text-xs text-slate-200 hover:text-white transition-colors bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg"
              >
                {isDownloaded ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex-1 p-5 overflow-auto font-mono text-xs text-slate-300 relative bg-black/40">
            {secrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <Info className="h-8 w-8 text-slate-600" />
                <span>No variables found in this environment.</span>
              </div>
            ) : (
              <pre className="whitespace-pre select-all selection:bg-indigo-500/30 rounded-lg p-4 border border-white/[0.04] bg-black/60 h-full overflow-auto">
                {generatedText}
              </pre>
            )}
          </div>

          {/* Bottom helper */}
          <div className="p-3.5 border-t border-white/[0.08] bg-black/40 text-[10px] text-slate-400 leading-relaxed flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Zero-Knowledge Safety Warning:</strong> Direct downloads are secure. Plaintext variables are only rendered temporarily in browser memory when <em>"Reveal Secrets"</em> is activated.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
