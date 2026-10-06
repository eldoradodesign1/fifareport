import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BarChart3, ChevronRight, CircleHelp, ClipboardList, FileText, LayoutDashboard, Package, Settings, Shield, ShoppingCart, Sparkles, Users, Download, Zap } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import ReportWorkspace from "@/components/ReportWorkspace";
import SettingsView from "@/components/SettingsView";
import type { CallReport, DataMode, SupabaseConfig } from "@/types/report";
import {
  DEMO_REPORTS, exportReportsCsv, exportReportsJson, exportReportsPdf, exportReportsXlsx,
  fetchSupabaseReports, isSupabaseConfigured, loadLocalReports, makeBlankReport, persistLocalReports,
  readSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, upsertSupabaseReport,
} from "@/lib/report-data";

const NAVIGATION = [
  { title: "Rapport", path: "/", icon: ClipboardList },
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Mes rapports", path: "/reports", icon: FileText },
  { title: "Commandes", path: "/orders", icon: ShoppingCart },
  { title: "Paramètres", path: "/settings", icon: Settings },
  { title: "Aide", path: "/help", icon: CircleHelp },
];

function getNextSequence(reports: CallReport[]) {
  return Math.max(17, ...reports.map(report => Number(report.id.split("-").at(-1)) + 1 || 17));
}

export default function Home() {
  const [path, setPath] = useLocation();
  const [draft, setDraft] = useState<CallReport>(() => makeBlankReport(17, 3265));
  const [reports, setReports] = useState<CallReport[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("local");
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => readSupabaseConfig());
  const [isLight, setIsLight] = useState(false);
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  useEffect(() => {
    let alive = true;
    const config = readSupabaseConfig();
    setSupabaseConfig(config);
    const local = loadLocalReports();
    setReports(local);
    const load = async () => {
      if (isSupabaseConfigured(config)) {
        try {
          const remote = await fetchSupabaseReports(config);
          if (!alive) return;
          setReports(remote);
          persistLocalReports(remote);
          setDataMode("supabase");
        } catch {
          if (alive) setDataMode("local");
        }
      }
      if (alive) setLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, []);

  const changeDraft = useCallback(<K extends keyof CallReport>(key: K, value: CallReport[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  }, []);

  const saveReport = useCallback(async (duration: number) => {
    const saved: CallReport = { ...draft, duration_seconds: duration, created_at: new Date().toISOString(), status: "Validé" };
    const next = [saved, ...reports.filter(report => report.id !== saved.id)].sort((a, b) => b.created_at.localeCompare(a.created_at));
    persistLocalReports(next);
    setReports(next);
    setDraft(saved);
    if (dataMode === "supabase" && isSupabaseConfigured(supabaseConfig)) {
      try {
        await upsertSupabaseReport(supabaseConfig, saved);
        notify("Rapport enregistré dans Supabase et en local.");
        return;
      } catch (error) {
        setDataMode("local");
        notify(`Copie locale sauvegardée ; Supabase indisponible : ${error instanceof Error ? error.message : "connexion impossible"}`);
        return;
      }
    }
    notify("Rapport enregistré dans le mode démo local.");
  }, [dataMode, draft, notify, reports, supabaseConfig]);

  const refreshReports = useCallback(async () => {
    if (dataMode === "supabase" && isSupabaseConfigured(supabaseConfig)) {
      try {
        const remote = await fetchSupabaseReports(supabaseConfig);
        setReports(remote);
        persistLocalReports(remote);
        notify("Historique actualisé depuis Supabase.");
        return;
      } catch (error) {
        setDataMode("local");
        notify(`Mode local activé : ${error instanceof Error ? error.message : "connexion impossible"}`);
      }
    }
    const local = loadLocalReports();
    setReports(local);
    notify("Données locales actualisées.");
  }, [dataMode, notify, supabaseConfig]);

  const openReport = useCallback((report: CallReport) => {
    setDraft({ ...report });
    setPath("/");
  }, [setPath]);

  const createNewReport = useCallback(() => {
    setDraft(makeBlankReport(getNextSequence(reports)));
    setPath("/");
    notify("Nouveau dossier prêt à compléter.");
  }, [notify, reports, setPath]);

  const clearDraft = useCallback(() => {
    setDraft(makeBlankReport(getNextSequence(reports)));
    notify("Le formulaire a été réinitialisé.");
  }, [notify, reports]);

  const saveConfig = useCallback(async (config: SupabaseConfig) => {
    saveSupabaseConfig(config);
    setSupabaseConfig(config);
    if (!isSupabaseConfigured(config)) {
      setDataMode("local");
      setReports(loadLocalReports());
      return;
    }
    await testSupabaseConnection(config);
    const remote = await fetchSupabaseReports(config);
    setReports(remote);
    persistLocalReports(remote);
    setDataMode("supabase");
  }, []);

  const view = path === "/settings" ? "settings" : path === "/reports" ? "reports" : path === "/dashboard" ? "dashboard" : path === "/orders" ? "orders" : path === "/help" ? "help" : "report";
  const pageTitle = view === "settings" ? "Paramètres" : view === "dashboard" ? "Dashboard" : view === "reports" ? "Mes rapports" : view === "orders" ? "Commandes" : view === "help" ? "Aide" : "Rapport";

  return <div className={`app-frame ${isLight ? "light-mode" : ""}`}>
    <aside className="nav-rail">
      <div className="brand-block"><img src="/assets/brand-mark.png" alt="Coca-Cola" /><span>FIFA PROMO</span></div>
      <nav className="main-navigation" aria-label="Navigation principale">
        {NAVIGATION.map(({ title, path: href, icon: Icon }) => <button key={href} type="button" onClick={() => setPath(href)} className={`nav-item ${view === (href === "/" ? "report" : href.slice(1)) ? "active" : ""}`}>
          <Icon size={24} strokeWidth={1.45} /><span>{title}</span>
        </button>)}
      </nav>
      <div className="agent-profile"><img src="/assets/avatar-demo.png" alt="Agent de démonstration" /><strong>Agent K.</strong><span><i /> En ligne</span></div>
    </aside>

    <main className="app-window">
      {view === "report" && <ReportWorkspace
        draft={draft} onChange={changeDraft} reports={reports} dataMode={dataMode} isLight={isLight} language={language}
        onToggleTheme={() => setIsLight(value => !value)} onToggleLanguage={() => setLanguage(value => value === "FR" ? "EN" : "FR")}
        onSave={saveReport} onClear={clearDraft} onRefresh={refreshReports} onNew={createNewReport}
        onOpen={openReport} onGoSettings={() => setPath("/settings")} onGoReports={() => setPath("/reports")}
        onExportCsv={() => exportReportsCsv(reports)} onExportJson={() => exportReportsJson(reports)}
        onExportXlsx={() => exportReportsXlsx(reports)} onExportPdf={() => exportReportsPdf(reports)}
        timezone={supabaseConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
      />}
      {view === "settings" && <SettingsView config={supabaseConfig} dataMode={dataMode} reports={reports} onBack={() => setPath("/")} onSaveConfig={saveConfig} onExportCsv={() => exportReportsCsv(reports)} onExportJson={() => exportReportsJson(reports)} onExportXlsx={() => exportReportsXlsx(reports)} onExportPdf={() => exportReportsPdf(reports)} />}
      {view === "dashboard" && <DashboardPage reports={reports} onOpen={openReport} onNavigate={setPath} />}
      {view === "reports" && <ReportsPage reports={reports} onOpen={openReport} onExportCsv={() => exportReportsCsv(reports)} onExportJson={() => exportReportsJson(reports)} onExportXlsx={() => exportReportsXlsx(reports)} onExportPdf={() => exportReportsPdf(reports)} />}
      {view === "orders" && <OrdersPage reports={reports} />}
      {view === "help" && <HelpPage onNavigate={setPath} />}
      {toast && <div className="toast-message" role="status"><Sparkles size={15} />{toast}</div>}
      {loading && <div className="load-strip"><span /> Synchronisation des données…</div>}
    </main>
  </div>;
}

function PageHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <header className="secondary-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>{action}</header>;
}

function DashboardPage({ reports, onOpen, onNavigate }: { reports: CallReport[]; onOpen: (report: CallReport) => void; onNavigate: (path: string) => void }) {
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const visibleReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      const dateValue = report.date;
      if (!dateValue) return true;
      if (startDate && dateValue < startDate) return false;
      if (endDate && dateValue > endDate) return false;
      return true;
    });

    if (range === "all") return filtered;
    const days = Number(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return filtered.filter((report) => new Date(`${report.date}T12:00:00`) >= cutoff);
  }, [endDate, range, reports, startDate]);

  const validated = visibleReports.filter(report => report.status === "Validé").length;
  const pending = visibleReports.filter(report => report.status === "En attente").length;
  const rejected = visibleReports.filter(report => report.status === "Refusé").length;
  const totalGain = visibleReports.reduce((sum, report) => sum + (Number(report.announced_gain.replace(/[^0-9]/g, "")) || 0), 0);

  const trendData = useMemo(() => {
    const map = new Map<string, { date: string; total: number; valid: number; pending: number }>();
    for (const report of visibleReports) {
      const key = report.date;
      const current = map.get(key) ?? { date: key, total: 0, valid: 0, pending: 0 };
      current.total += 1;
      if (report.status === "Validé") current.valid += 1;
      if (report.status === "En attente") current.pending += 1;
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [visibleReports]);

  const channelData = useMemo(() => {
    const map = new Map<string, number>();
    for (const report of visibleReports) {
      map.set(report.contact_channel, (map.get(report.contact_channel) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [visibleReports]);

  const statusData = useMemo(() => [
    { name: "Validé", value: validated, color: "#14b8a6" },
    { name: "En attente", value: pending, color: "#f59e0b" },
    { name: "Refusé", value: rejected, color: "#ef4444" },
  ], [pending, rejected, validated]);

  const productData = useMemo(() => {
    const map = new Map<string, number>();
    for (const report of visibleReports) {
      map.set(report.product, (map.get(report.product) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [visibleReports]);

  const metrics = [
    { label: "Rapports collectés", value: visibleReports.length, icon: FileText, color: "red" },
    { label: "Validés", value: validated, icon: Shield, color: "green" },
    { label: "En attente", value: pending, icon: Users, color: "amber" },
    { label: "Gains annoncés", value: `${totalGain.toLocaleString("fr-FR")} FC`, icon: BarChart3, color: "pink" },
  ];

  return <div className="secondary-page overview-page">
    <PageHeader eyebrow="CENTRE DE CONTRÔLE" title="Dashboard" text="Vue analytique des appels, canaux, gains et suivi des dossiers." action={<button type="button" className="save-settings" onClick={() => onNavigate("/")}><ClipboardList size={15} /> Nouveau rapport</button>} />

    <div className="dashboard-filter-bar glass-panel">
      <div className="filter-group">
        <label>Plage</label>
        <select value={range} onChange={event => setRange(event.target.value as "7" | "30" | "90" | "all")}>
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
          <option value="all">Tout</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Du</label>
        <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
      </div>
      <div className="filter-group">
        <label>Au</label>
        <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
      </div>
    </div>

    <div className="metric-grid">{metrics.map(({ label, value, icon: Icon, color }) => <div className="glass-panel metric-card" key={label}><span className={`metric-icon ${color}`}><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div><span className="metric-sparkline">•••</span></div>)}</div>

    <div className="dashboard-grid">
      <section className="glass-panel chart-panel wide-panel">
        <div className="panel-heading"><BarChart3 size={16} /><span>ÉVOLUTION DES DOSSIERS</span></div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d5d0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#ef4444" fill="url(#areaFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass-panel chart-panel">
        <div className="panel-heading"><Shield size={16} /><span>STATUTS</span></div>
        <div className="chart-container donut-box">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-list">{statusData.map(item => <div key={item.name}><span className="legend-dot" style={{ background: item.color }} />{item.name}<strong>{item.value}</strong></div>)}</div>
      </section>

      <section className="glass-panel chart-panel">
        <div className="panel-heading"><Users size={16} /><span>CANAUX DE CONTACT</span></div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d5d0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass-panel chart-panel">
        <div className="panel-heading"><Package size={16} /><span>PRODUITS</span></div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={productData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#d9d5d0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>

    <section className="glass-panel overview-recent dashboard-table">
      <div className="panel-heading"><FileText size={16} /><span>DERNIERS RAPPORTS</span><button type="button" onClick={() => onNavigate("/reports")}>Tout voir <ChevronRight size={14} /></button></div>
      <div className="table-scroll"><table><thead><tr><th>Dossier</th><th>Client</th><th>Canal</th><th>Date</th><th>Statut</th><th /></tr></thead><tbody>{visibleReports.slice(0, 6).map(report => <tr key={report.id} onClick={() => onOpen(report)}><td>{report.id}</td><td>{report.client_name}</td><td>{report.contact_channel}</td><td>{report.date}</td><td><span className={`status-pill ${report.status === "Validé" ? "status-approved" : report.status === "Refusé" ? "status-rejected" : "status-pending"}`}>{report.status}</span></td><td><ChevronRight size={14} /></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function Clock3Icon() { return <span className="icon-holder"><FileText size={16} /></span>; }

function ReportsPage({ reports, onOpen, onExportCsv, onExportJson, onExportXlsx, onExportPdf }: { reports: CallReport[]; onOpen: (report: CallReport) => void; onExportCsv: () => void; onExportJson: () => void; onExportXlsx: () => void; onExportPdf: () => void }) {
  const [filter, setFilter] = useState("Tous");
  const shown = useMemo(() => filter === "Tous" ? reports : reports.filter(report => report.status === filter), [filter, reports]);
  return <div className="secondary-page reports-page">
    <PageHeader eyebrow="ARCHIVES" title="Mes rapports" text="Consultez, reprenez ou exportez les dossiers collectés." action={<><button type="button" className="quiet-action" onClick={onExportCsv}><Download size={14} /> CSV</button><button type="button" className="quiet-action" onClick={onExportJson}><Download size={14} /> JSON</button><button type="button" className="save-settings" onClick={onExportXlsx}><Download size={14} /> XLSX</button><button type="button" className="save-settings" onClick={onExportPdf}><Download size={14} /> PDF</button></>} />
    <div className="filter-tabs">{["Tous", "Validé", "En attente", "Refusé"].map(label => <button type="button" className={filter === label ? "active" : ""} key={label} onClick={() => setFilter(label)}>{label}<span>{label === "Tous" ? reports.length : reports.filter(report => report.status === label).length}</span></button>)}</div>
    <section className="glass-panel full-reports-list"><div className="panel-heading"><FileText size={16} /><span>HISTORIQUE COMPLET</span></div><div className="table-scroll"><table><thead><tr><th>Identifiant</th><th>Client</th><th>Téléphone</th><th>Commune</th><th>Produit</th><th>Date</th><th>Statut</th><th /></tr></thead><tbody>{shown.map(report => <tr key={report.id} onClick={() => onOpen(report)}><td>{report.id}</td><td>{report.client_name}</td><td>{report.phone}</td><td>{report.commune}</td><td>{report.product}</td><td>{report.date}</td><td><span className={`status-pill ${report.status === "Validé" ? "status-approved" : report.status === "Refusé" ? "status-rejected" : "status-pending"}`}>{report.status}</span></td><td><ChevronRight size={14} /></td></tr>)}</tbody></table></div>{shown.length === 0 && <div className="empty-reports large-empty">Aucun dossier dans cette catégorie.</div>}</section>
  </div>;
}

function OrdersPage({ reports }: { reports: CallReport[] }) {
  const orders = reports.filter(report => report.announced_gain && report.product);
  return <div className="secondary-page orders-page"><PageHeader eyebrow="SUIVI PROMOTIONNEL" title="Commandes" text="Aperçu des gains et produits associés aux rapports de démonstration." /><section className="glass-panel full-reports-list"><div className="panel-heading"><ShoppingCart size={16} /><span>GAINS DÉCLARÉS</span></div><div className="table-scroll"><table><thead><tr><th>Dossier</th><th>Client</th><th>Produit</th><th>Gain annoncé</th><th>Point de vente</th><th>État</th></tr></thead><tbody>{orders.map(report => <tr key={report.id}><td>{report.id}</td><td>{report.client_name}</td><td>{report.product}</td><td>{report.announced_gain}</td><td>{report.point_of_sale || "—"}</td><td>{report.gain_status}</td></tr>)}</tbody></table></div></section></div>;
}

function HelpPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <div className="secondary-page help-page"><PageHeader eyebrow="CENTRE D’AIDE" title="Aide opérateur" text="Raccourcis, saisie et informations sur la synchronisation des dossiers." action={<button type="button" className="quiet-action" onClick={() => onNavigate("/")}><ClipboardList size={15} /> Retour au rapport</button>} /><div className="help-cards"><section className="glass-panel help-card"><div className="panel-heading"><Zap size={16} /><span>MACROS CLAVIER</span></div><p>Appliquez rapidement un motif au rapport en utilisant <kbd>Ctrl</kbd> + la touche indiquée.</p><div className="help-shortcuts">{[["0", "Autre"], ["1", "Code illisible"], ["2", "Gain non reçu"], ["3", "Pas de gain"], ["4", "Ne sait pas participer"], ["5", "Ne trouve pas le code"], ["9", "Erreur système"], ["I", "Demande info promo"]].map(([key, value]) => <div key={key}><span>{value}</span><kbd>Ctrl + {key}</kbd></div>)}</div></section><section className="glass-panel help-card"><div className="panel-heading"><Shield size={16} /><span>DONNÉES & SÉCURITÉ</span></div><p>Sans réglage Supabase, les rapports de démonstration et vos modifications sont enregistrés dans le navigateur. La connexion distante utilise uniquement une clé anon/public.</p><button type="button" className="subtle-link" onClick={() => onNavigate("/settings")}>Ouvrir les paramètres <ChevronRight size={14} /></button></section></div></div>;
}
