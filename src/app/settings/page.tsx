"use client";

import { useRef, useState } from "react";
import { useStore, type ExportBundle } from "@/lib/store";
import { Field, Modal, NumberInput, PageTitle, SectionTitle } from "@/components/ui";
import { fmtClock } from "@/lib/utils";

export default function SettingsPage() {
  const { settings, updateSettings, exportAll, importAll, resetAll, logs, daily, weekly } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const doExport = () => {
    const bundle = exportAll();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sabers-gym-${bundle.exportedAt.slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doImport = async (f: File) => {
    try {
      const b = JSON.parse(await f.text()) as ExportBundle;
      if (!b || b.version !== 1 || !Array.isArray(b.logs)) throw new Error("bad");
      importAll(b);
      setMsg(`Imported ${b.logs.length} sessions, ${b.daily?.length ?? 0} check-ins and ${b.weekly?.length ?? 0} weigh-ins.`);
    } catch {
      setMsg("That file is not a Saber's Gym export.");
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="space-y-6 fade-in">
      <PageTitle eyebrow="Preferences" title="Settings" />

      <section className="card p-4 space-y-4">
        <SectionTitle>You</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className="field" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} />
          </Field>
          <Field label="Weight unit" hint="Labels only, no conversion.">
            <select className="field" value={settings.unit} onChange={(e) => updateSettings({ unit: e.target.value as "kg" | "lb" })}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </Field>
        </div>
        <Field label="Theme">
          <div className="grid grid-cols-3 gap-1 p-1 card">
            {(["dark", "light", "system"] as const).map((t) => (
              <button key={t} onClick={() => updateSettings({ theme: t })} className={`rounded-md py-2 text-sm capitalize ${settings.theme === t ? "bg-panel-2 text-ink" : "text-ink-3"}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
      </section>

      <section className="card p-4 space-y-4">
        <SectionTitle>Rest timer</SectionTitle>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm">Start the timer when a set is ticked</span>
          <input type="checkbox" className="accent-[var(--accent)] h-5 w-5" checked={settings.autoRestTimer} onChange={(e) => updateSettings({ autoRestTimer: e.target.checked })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Compound lifts (${fmtClock(settings.restCompound)})`}>
            <NumberInput value={settings.restCompound} step={15} min={15} onChange={(v) => updateSettings({ restCompound: v === "" ? 150 : v })} />
          </Field>
          <Field label={`Isolation & machines (${fmtClock(settings.restIsolation)})`}>
            <NumberInput value={settings.restIsolation} step={15} min={15} onChange={(v) => updateSettings({ restIsolation: v === "" ? 75 : v })} />
          </Field>
        </div>
        <p className="text-xs text-ink-3">Seconds. The program suggests 2–3 min for compounds and 60–90 s for everything else.</p>
      </section>

      <section className="card p-4 space-y-3">
        <SectionTitle>Your data</SectionTitle>
        <p className="text-sm text-ink-2">
          Everything is stored in this browser only: {logs.length} sessions, {daily.length} check-ins, {weekly.length} weigh-ins. Export a backup before clearing the browser or switching devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={doExport}>
            Export backup
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
        {msg && <p className="text-sm text-ink-2">{msg}</p>}
      </section>

      <section className="card p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">Start over</div>
          <div className="text-xs text-ink-3">Deletes all sessions, check-ins and weigh-ins, and resets the program.</div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => setResetOpen(true)}>
          Erase everything
        </button>
      </section>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Erase everything?">
        <p className="text-sm text-ink-2 mb-4">All logged data is deleted from this browser. Export a backup first if you might want it back.</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={() => setResetOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              resetAll();
              setResetOpen(false);
            }}
          >
            Erase
          </button>
        </div>
      </Modal>
    </div>
  );
}
