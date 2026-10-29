"use client";

import { Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getPromptsAction, resetPromptsAction, savePromptAction } from "@/lib/actions/prompts";
import type { UnderwritingPrompt } from "@/lib/types";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-lg"
        aria-label="Underwriting settings"
      >
        <Settings size={20} />
      </button>
      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prompts, setPrompts] = useState<UnderwritingPrompt[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    getPromptsAction().then((result) => {
      if (result.ok) setPrompts(result.prompts);
      else setMessage(result.error);
    });
  }, [open]);

  if (!open) return null;

  async function save(prompt: UnderwritingPrompt) {
    setPending(true);
    const result = await savePromptAction(prompt.key, prompt.body);
    setPending(false);
    setMessage(result.ok ? "Saved" : result.error);
  }

  async function reset() {
    setPending(true);
    const result = await resetPromptsAction();
    setPending(false);
    if (result.ok) {
      setPrompts(result.prompts);
      setMessage("Restored the original prompts");
    } else setMessage(result.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-auto bg-white p-6 shadow-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Underwriting system prompts"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Underwriting prompts</h2>
            <p className="mt-1 text-sm text-slate-500">
              These instructions run when a landing page is created. Repair dollars and MAO are calculated from the rehab category the model chooses.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close settings">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5">
          {prompts.map((prompt) => (
            <section key={prompt.key} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold">{prompt.title}</h3>
              <textarea
                value={prompt.body}
                onChange={(event) =>
                  setPrompts((current) =>
                    current.map((item) => (item.key === prompt.key ? { ...item, body: event.target.value } : item)),
                  )
                }
                className="mt-3 min-h-48 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => save(prompt)}
                className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Save prompt
              </button>
            </section>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{message}</p>
          <button type="button" onClick={reset} disabled={pending} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Reset both prompts
          </button>
        </div>
      </aside>
    </div>
  );
}
