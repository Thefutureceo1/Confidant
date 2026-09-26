import React, { useState, useEffect, useMemo } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Play,
  RotateCw,
  Eye,
  EyeOff,
  Check,
  Copy,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  FileCode,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import { db } from '../lib/storage';
import { WebhookConfig, WebhookDeliveryLog, Project } from '../types';
import { dispatchWebhooks } from '../lib/webhookDispatcher';
import { useAuth } from '../context/AuthContext';

interface WebhookPanelProps {
  project: Project;
}

export const WebhookPanel: React.FC<WebhookPanelProps> = ({ project }) => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formEvents, setFormEvents] = useState<string[]>([
    'secret.created',
    'secret.updated',
    'secret.deleted',
    'secret.reverted',
  ]);

  // UI state
  const [showSecretKey, setShowSecretKey] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'node' | 'python' | 'go'>('node');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Load webhooks and logs on mount/update
  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = () => {
    setWebhooks(db.getWebhooks(project.id));
    setDeliveryLogs(db.getWebhookDeliveryLogs(project.id));
  };

  const handleGenerateSecret = () => {
    const arr = new Uint8Array(20);
    window.crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    setFormSecret(`whsec_${hex}`);
  };

  const handleToggleEvent = (event: string) => {
    if (formEvents.includes(event)) {
      setFormEvents(formEvents.filter((e) => e !== event));
    } else {
      setFormEvents([...formEvents, event]);
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formName.trim()) {
      setFeedback({ type: 'error', text: 'Webhook name is required.' });
      return;
    }

    if (!formUrl.trim() || !formUrl.startsWith('http')) {
      setFeedback({ type: 'error', text: 'Please enter a valid HTTP or HTTPS destination URL.' });
      return;
    }

    if (formEvents.length === 0) {
      setFeedback({ type: 'error', text: 'Please select at least one trigger event.' });
      return;
    }

    try {
      if (editingId) {
        db.updateWebhook(editingId, {
          name: formName.trim(),
          url: formUrl.trim(),
          secret_token: formSecret.trim(),
          active: formActive,
          events: formEvents as any[],
        });
        setFeedback({ type: 'success', text: 'Webhook configuration updated successfully.' });
      } else {
        db.addWebhook({
          project_id: project.id,
          name: formName.trim(),
          url: formUrl.trim(),
          secret_token: formSecret.trim(),
          active: formActive,
          events: formEvents as any[],
        });
        setFeedback({ type: 'success', text: 'Webhook endpoint registered successfully.' });
      }

      // Reset form
      setIsEditing(false);
      setEditingId(null);
      setFormName('');
      setFormUrl('');
      setFormSecret('');
      setFormActive(true);
      setFormEvents(['secret.created', 'secret.updated', 'secret.deleted', 'secret.reverted']);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save webhook configuration.' });
    }
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingId(webhook.id);
    setFormName(webhook.name);
    setFormUrl(webhook.url);
    setFormSecret(webhook.secret_token);
    setFormActive(webhook.active);
    setFormEvents(webhook.events);
    setIsEditing(true);
  };

  const handleDeleteWebhook = (id: string) => {
    if (window.confirm('Are you sure you want to delete this webhook? Past delivery logs belonging to this endpoint will be purged.')) {
      db.deleteWebhook(id);
      loadData();
      setFeedback({ type: 'success', text: 'Webhook endpoint deleted.' });
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all webhook delivery audit logs for this project?')) {
      db.clearWebhookDeliveryLogs(project.id);
      loadData();
    }
  };

  const handleTriggerTest = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    setFeedback(null);

    try {
      // Simulate/Trigger a real POST call in browser runtime
      await dispatchWebhooks(project.id, 'secret.updated', {
        environment_id: 'env-test',
        environment_name: 'production',
        actor_email: user?.email || 'test.developer@envault.dev',
        actor_name: user?.name || 'Test Engine',
        impacted_keys: ['TEST_SECRET_CONNECTION_SYNC', 'API_KEY_ROTATED_SUCCESSFULLY'],
        notes: 'Interactive diagnostic webhook trigger.',
      });

      setFeedback({
        type: 'success',
        text: `Diagnostic ping sent to ${webhook.name}. Review results in Delivery Logs below.`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to trigger diagnostic test.' });
    } finally {
      setTestingId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    node: `// Express/Node.js Webhook Signature Verification Middleware
const crypto = require('crypto');

function verifyEnvaultSignature(req, res, next) {
  // Webhook secret token configured in Envault Project Settings
  const SECRET_TOKEN = process.env.ENVAULT_WEBHOOK_SECRET;
  
  const signatureHeader = req.headers['x-envault-signature'];
  if (!signatureHeader) {
    return res.status(401).send('Signature missing');
  }

  // Extract sha256 payload signature
  const match = signatureHeader.match(/^sha256=(.+)$/);
  if (!match) {
    return res.status(401).send('Invalid signature format');
  }
  const receivedSignature = match[1];

  // Compute HMAC using the raw request body string
  const calculatedSignature = crypto
    .createHmac('sha256', SECRET_TOKEN)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Securely compare hashes using constant-time verification
  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(calculatedSignature, 'hex')
  );

  if (!isValid) {
    return res.status(403).send('Unauthorized payload signature');
  }

  next();
}`,
    python: `# Python / Flask Webhook Verification
import hmac
import hashlib
from flask import request, abort

def verify_envault_signature():
    secret_token = b"whsec_your_secret_here"
    signature_header = request.headers.get("X-Envault-Signature")
    
    if not signature_header or not signature_header.startswith("sha256="):
        abort(401, "Missing or invalid signature header")
        
    received_sig = signature_header.split("sha256=")[1]
    raw_payload = request.data
    
    # Compute HMAC-SHA256 signature
    computed_sig = hmac.new(
        secret_token,
        raw_payload,
        hashlib.sha256
    ).hexdigest()
    
    # Secure constant-time comparison
    if not hmac.compare_digest(received_sig, computed_sig):
        abort(403, "Payload signature verification failed")`,
    go: `// Go HTTP Webhook Signature Verification
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
)

func verifyEnvaultSignature(r *http.Request, secretToken string) bool {
	signatureHeader := r.Header.Get("X-Envault-Signature")
	if len(signatureHeader) < 8 { // Must start with "sha256="
		return false
	}
	receivedSignature := signatureHeader[7:]

	rawBody, err := io.ReadAll(r.Body)
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secretToken))
	mac.Write(rawBody)
	computedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(receivedSignature), []byte(computedSignature))
}`
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Intro block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Outbound Webhooks</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Dispatch HTTP POST requests to third-party endpoints automatically whenever secret environment variables are created, updated, or rolled back. Built for continuous integration with Kubernetes, Vercel, and GitHub Actions.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-medium transition-all shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Webhook Endpoint</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Edit Form Card */}
      {isEditing && (
        <form onSubmit={handleSaveWebhook} className="bg-[#0f1422]/90 border border-indigo-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {editingId ? 'Edit Webhook Endpoint' : 'Configure New Webhook'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setFormName('');
                setFormUrl('');
                setFormSecret('');
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Endpoint Friendly Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Vercel Staging Trigger"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Destination URL (POST)</label>
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://api.yourhost.com/webhooks/secrets"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">HMAC Signature Secret Token</label>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Generate Secret Key
                </button>
              </div>
              <input
                type="text"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                placeholder="whsec_... (empty to bypass signing payload)"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
              />
              <span className="block text-[10px] text-slate-500 leading-relaxed">
                HMAC-SHA256 signature calculated from this secret key will be dispatched in the <code>X-Envault-Signature</code> header.
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Webhook Trigger Events</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { value: 'secret.created', label: 'Secret Created' },
                  { value: 'secret.updated', label: 'Secret Updated' },
                  { value: 'secret.deleted', label: 'Secret Deleted' },
                  { value: 'secret.reverted', label: 'Rollback Executed' },
                ].map((ev) => {
                  const active = formEvents.includes(ev.value);
                  return (
                    <button
                      key={ev.value}
                      type="button"
                      onClick={() => handleToggleEvent(ev.value)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200 font-semibold'
                          : 'border-white/[0.06] bg-black/30 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${active ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                      <span className="text-[11px] font-mono">{ev.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-2">
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400">Endpoint Status:</span>
              <button
                type="button"
                onClick={() => setFormActive(!formActive)}
                className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-colors border uppercase ${
                  formActive
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {formActive ? 'Active (Listen)' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 text-xs hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                {editingId ? 'Save Changes' : 'Register Webhook'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Webhooks Endpoint List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured Endpoints ({webhooks.length})</h3>

        <div className="grid grid-cols-1 gap-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="p-4 bg-[#0d121f] rounded-xl border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-white/[0.12]">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h4 className="font-semibold text-white text-xs truncate max-w-xs">{wh.name}</h4>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                    wh.active
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {wh.active ? 'active' : 'disabled'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {wh.id}</span>
                </div>

                <div className="text-xs text-slate-400 font-mono truncate max-w-xl">
                  {wh.url}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide mr-1 font-bold">Triggers:</span>
                  {wh.events.map((e) => (
                    <span key={e} className="text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-white/[0.04] px-2 py-0.5 rounded-md">
                      {e}
                    </span>
                  ))}
                </div>

                {wh.secret_token && (
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono pt-1">
                    <span>Signing Token:</span>
                    <span>
                      {showSecretKey === wh.id ? wh.secret_token : '••••••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(showSecretKey === wh.id ? null : wh.id)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {showSecretKey === wh.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(wh.secret_token, `copy-${wh.id}`)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {copiedId === `copy-${wh.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 md:self-center">
                <button
                  type="button"
                  onClick={() => handleTriggerTest(wh)}
                  disabled={testingId === wh.id}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-xs hover:bg-indigo-500/15 disabled:opacity-50 transition-colors font-medium"
                >
                  <Play className={`h-3 w-3 ${testingId === wh.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === wh.id ? 'Testing...' : 'Test Delivery'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEditWebhook(wh)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteWebhook(wh.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="p-8 border border-dashed border-white/[0.08] text-center text-slate-500 rounded-xl space-y-1.5">
              <Webhook className="h-6 w-6 mx-auto text-slate-600" />
              <div className="text-xs">No outbound webhook endpoints configured for this project.</div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Code Tutorial Panel */}
      <div className="bg-[#0b0f19] border border-white/[0.05] rounded-xl p-4.5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
          <Server className="h-4 w-4 text-indigo-400" />
          <span>Webhook Signature Verification Reference</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Outbound webhooks from Envault carry a signature in the header to ensure verification before accepting. Use these reference snippets in your backend route handling to secure your endpoints:
        </p>

        {/* Tab triggers */}
        <div className="flex space-x-1.5 border-b border-white/[0.06] pb-2 text-xs">
          {[
            { id: 'node', name: 'Node.js/Express' },
            { id: 'python', name: 'Python/Flask' },
            { id: 'go', name: 'Go Standard' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id as any)}
              className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                activeCodeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative">
          <button
            onClick={() => handleCopy(codeSnippets[activeCodeTab], 'code-copy')}
            className="absolute right-3 top-3 p-1.5 rounded bg-black/60 text-slate-400 hover:text-white transition-all text-[10px] flex items-center space-x-1"
          >
            {copiedId === 'code-copy' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedId === 'code-copy' ? 'Copied' : 'Copy'}</span>
          </button>
          <pre className="p-4 rounded-xl bg-black/50 text-slate-300 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[250px]">
            {codeSnippets[activeCodeTab]}
          </pre>
        </div>
      </div>

      {/* Webhook Delivery Logs and Inspector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Logs & Audit Trail</h3>
          </div>
          {deliveryLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear Log History
            </button>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0c101d] overflow-hidden divide-y divide-white/[0.04]">
          {deliveryLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const date = new Date(log.created_at);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

            const targetWebhook = webhooks.find((w) => w.id === log.webhook_id);
            const webhookName = targetWebhook ? targetWebhook.name : 'Purged Webhook';

            return (
              <div key={log.id} className="transition-all hover:bg-white/[0.01]">
                <div className="p-3 flex items-center justify-between text-xs gap-3 flex-wrap">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-rose-500'}`} />

                    <div className="font-mono text-slate-300 truncate max-w-sm">
                      <span className="font-bold text-slate-200">{webhookName}</span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-indigo-400">{log.event}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">{dateStr} at {timeStr}</span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="font-mono text-slate-400">{log.duration_ms} ms</span>
                    <span className={`font-mono px-2 py-0.5 rounded font-bold ${
                      log.status_code === 200
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : log.status_code === null
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {log.status_code || 'CONN_ERR'}
                    </span>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium font-mono"
                    >
                      {isExpanded ? 'Collapse' : 'Inspect'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-black/30 border-t border-white/[0.04] space-y-3.5 text-[11px] font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Request headers and general details */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold font-sans">Request Headers</div>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04] space-y-1 overflow-x-auto text-slate-300 max-h-[140px]">
                          <div><strong>Method:</strong> POST</div>
                          <div><strong>URL:</strong> {log.url}</div>
                          {Object.entries(log.request_headers).map(([k, v]) => (
                            <div key={k} className="truncate">
                              <strong>{k}:</strong> {v}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Webhook Response */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold font-sans">Server Response</div>
                        <pre className="p-3 bg-black/40 rounded-xl border border-white/[0.04] text-slate-300 overflow-x-auto max-h-[140px] text-[11px] leading-relaxed">
                          {log.response_body || 'Empty Response Body'}
                        </pre>
                      </div>
                    </div>

                    {/* Post Payload */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold font-sans">POST Body Payload</div>
                      <pre className="p-3.5 bg-black/40 rounded-xl border border-white/[0.04] text-slate-300 overflow-x-auto max-h-[180px] text-[11px] leading-relaxed">
                        {log.request_payload}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {deliveryLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No webhook trigger deliveries logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
