import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Database, Download, Eye, EyeOff, KeyRound, Link2, Save, ShieldCheck, Table2, TimerReset } from "lucide-react";
import type { CallReport, DataMode, SupabaseConfig } from "@/types/report";
import { isSupabaseConfigured, testSupabaseConnection } from "@/lib/report-data";

interface Props {
  config: SupabaseConfig;
  dataMode: DataMode;
  reports: CallReport[];
  onBack: () => void;
  onSaveConfig: (config: SupabaseConfig) => Promise<void>;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
}

export default function SettingsView({ config, dataMode, reports, onBack, onSaveConfig, onExportCsv, onExportJson, onExportXlsx, onExportPdf }: Props) {
  const [draft, setDraft] = useState(config);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const timezoneOptions = useMemo(() => [
    "UTC",
    "Europe/Paris",
    "Europe/London",
    "Africa/Abidjan",
    "Africa/Dakar",
    "America/New_York",
    "Asia/Dubai",
    "Asia/Tokyo",
  ], []);
  const change = (key: keyof SupabaseConfig, value: string) => setDraft(current => ({ ...current, [key]: value }));

  const test = async () => {
    setTesting(true);
    setNotice(null);
    try {
      if (!isSupabaseConfigured(draft)) throw new Error("Renseignez l’URL, la clé anon/public et la table avant de tester.");
      const result = await testSupabaseConnection(draft);
      setNotice({ kind: "success", text: result });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Impossible de joindre Supabase." });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await onSaveConfig(draft);
      setNotice({ kind: "success", text: isSupabaseConfigured(draft) ? "Réglages enregistrés. La connexion Supabase est utilisée si la table est accessible." : "Configuration effacée. L’application utilise le mode local de démonstration." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Les réglages n’ont pas pu être enregistrés." });
    } finally {
      setSaving(false);
    }
  };

  return <div className="secondary-page settings-page">
    <header className="secondary-header">
      <div><div className="eyebrow">CONFIGURATION</div><h1>Paramètres</h1><p>Connectez votre projet Supabase quand vous serez prêt. L’outil reste utilisable en mode local.</p></div>
      <button type="button" className="quiet-action back-button" onClick={onBack}><ArrowLeft size={15} /> Retour au rapport</button>
    </header>
    <div className="settings-grid">
      <section className="glass-panel settings-card">
        <div className="settings-section-title"><span className="settings-icon"><Database size={18} /></span><div><h2>Connexion Supabase</h2><p>Les identifiants sont conservés dans le navigateur de cet appareil.</p></div><span className={`connection-badge ${dataMode === "supabase" ? "connected" : "disconnected"}`}><i />{dataMode === "supabase" ? "Connecté" : "Mode local"}</span></div>
        <div className="settings-fields">
          <label><span><Link2 size={13} /> URL du projet</span><input type="url" value={draft.url} onChange={event => change("url", event.target.value)} placeholder="https://votre-projet.supabase.co" autoComplete="url" /></label>
          <label><span><KeyRound size={13} /> Clé anon / public</span><div className="key-input-wrap"><input type={showKey ? "text" : "password"} value={draft.anonKey} onChange={event => change("anonKey", event.target.value)} placeholder="eyJ… (clé publique anon)" autoComplete="off" /><button type="button" onClick={() => setShowKey(value => !value)} aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}>{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          <label><span><Table2 size={13} /> Nom de la table</span><input value={draft.table} onChange={event => change("table", event.target.value)} placeholder="call_reports" /></label>
          <label><span><TimerReset size={13} /> Fuseau horaire</span><input list="timezone-options" value={draft.timezone} onChange={event => change("timezone", event.target.value)} placeholder="Europe/Paris" /></label>
          <datalist id="timezone-options">
            {timezoneOptions.map((timezone) => <option key={timezone} value={timezone} />)}
          </datalist>
        </div>
        <div className="security-note"><ShieldCheck size={17} /><p>Utilisez uniquement la clé <strong>anon/public</strong> du navigateur et activez les politiques RLS dans Supabase. N’entrez jamais votre clé secrète <code>service_role</code>.</p></div>
        {notice && <div className={`settings-notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={15} /> : <span>!</span>}{notice.text}</div>}
        <div className="settings-actions"><button type="button" className="quiet-action" onClick={test} disabled={testing}>{testing ? <span className="mini-spinner" /> : <Database size={15} />}{testing ? "Test en cours…" : "Tester la connexion"}</button><button type="button" className="save-settings" onClick={save} disabled={saving}><Save size={15} />{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</button></div>
        <details className="schema-help"><summary>Structure de table conseillée</summary><p>La table doit autoriser la lecture et l’écriture avec la clé anon, et posséder une colonne <code>id</code> unique. Exemple de base (ajustez les politiques RLS selon votre équipe) :</p><pre>{`create table public.call_reports (
  id text primary key,
  created_at timestamptz default now(),
  date date,
  contact_channel text,
  client_name text,
  phone text,
  commune text,
  gain_name text,
  announced_gain text,
  gain_status text,
  product text,
  point_of_sale text,
  code_capsule text,
  participated boolean default false,
  internal_actions boolean default false,
  complaint text,
  priority text,
  follow_up boolean default false,
  company_action text,
  internal_comment text,
  status text,
  duration_seconds integer
);`}</pre></details>
      </section>

      <aside className="settings-side">
        <section className="glass-panel settings-mode-card"><div className="panel-heading"><Database size={16} /><span>STOCKAGE ACTIF</span></div><div className="mode-status-line"><span className={`mode-dot ${dataMode}`} /><strong>{dataMode === "supabase" ? "Supabase" : "Démonstration locale"}</strong></div><p>{dataMode === "supabase" ? "Les nouveaux rapports sont envoyés vers votre table." : "Les rapports sont conservés dans le stockage local du navigateur."}</p><button type="button" className="subtle-link" onClick={() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus()}>Configurer Supabase <ArrowLeft size={13} /></button></section>
        <section className="glass-panel export-card"><div className="panel-heading"><Download size={16} /><span>EXPORT DES DONNÉES</span></div><strong className="export-count">{reports.length}<small> rapports disponibles</small></strong><p>Téléchargez l’ensemble des données collectées. Les exports incluent les champs du dossier et les statuts.</p><button type="button" onClick={onExportCsv}><Download size={15} /> CSV</button><button type="button" onClick={onExportJson}><Download size={15} /> JSON</button><button type="button" onClick={onExportXlsx}><Download size={15} /> XLSX</button><button type="button" onClick={onExportPdf}><Download size={15} /> PDF</button></section>
        <div className="settings-footnote"><ShieldCheck size={15} /> Clés enregistrées uniquement dans ce navigateur.</div>
      </aside>
    </div>
  </div>;
}
