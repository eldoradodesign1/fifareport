import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, FileText, Gift, Globe2, MessageCircle, MessageSquare, Moon, PhoneCall,
  RefreshCw, Shield, Sun, Trophy, UserRound, WalletCards, Zap, Facebook, Trash2,
  Download, XCircle,
} from "lucide-react";
import type { CallReport, ContactChannel, DataMode, ReportStatus } from "@/types/report";

const CHANNELS: Array<{ name: ContactChannel; Icon: typeof PhoneCall }> = [
  { name: "Appel", Icon: PhoneCall },
  { name: "WhatsApp", Icon: MessageCircle },
  { name: "SMS", Icon: MessageSquare },
  { name: "Facebook", Icon: Facebook },
];
const PRODUCTS = ["Coca-Cola", "Fanta", "Sprite", "Autre"];
const MACROS = [
  { title: "Autre", key: "0" },
  { title: "Code illisible", key: "1" },
  { title: "Gain non reçu", key: "2" },
  { title: "Pas de gain", key: "3" },
  { title: "Ne sait pas participer", key: "4" },
  { title: "Ne trouve pas le code", key: "5" },
  { title: "Erreur système", key: "9" },
  { title: "Demande info promo", key: "I" },
];
const WEEKDAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

type FieldChange = <K extends keyof CallReport>(key: K, value: CallReport[K]) => void;

interface Props {
  draft: CallReport;
  onChange: FieldChange;
  reports: CallReport[];
  dataMode: DataMode;
  isLight: boolean;
  language: "FR" | "EN";
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onSave: (duration: number) => void;
  onClear: () => void;
  onRefresh: () => void;
  onNew: () => void;
  onOpen: (report: CallReport) => void;
  onGoSettings: () => void;
  onGoReports: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
  timezone: string;
}

function Panel({ title, icon: Icon, className = "", children }: {
  title: string;
  icon: typeof Gift;
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={`glass-panel ${className}`}>
    <div className="panel-heading"><Icon size={16} strokeWidth={1.7} /><span>{title}</span></div>
    {children}
  </section>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="field-label">{children}</label>;
}

function Toggle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label?: string }) {
  return <button type="button" className={`toggle-row ${checked ? "is-on" : ""}`} onClick={onClick} aria-pressed={checked}>
    {label && <span>{label}</span>}<span className="switch-track"><span className="switch-thumb" /></span>
  </button>;
}

function ProductTiles({ value, onSelect, compact = false }: { value: string; onSelect: (product: string) => void; compact?: boolean }) {
  const initials: Record<string, string> = { "Coca-Cola": "Coca-Cola", Fanta: "Fanta", Sprite: "Sprite", Autre: "···" };
  return <div className={`product-tiles ${compact ? "compact" : ""}`}>
    {PRODUCTS.map(product => <button key={product} type="button" onClick={() => onSelect(product)} className={`product-tile product-${product.toLowerCase().replace("-", "").replace(" ", "") } ${value === product ? "selected" : ""}`}>
      {value === product && <span className="product-check"><Check size={10} /></span>}
      <span className={`product-wordmark wordmark-${product.toLowerCase().replace("-", "").replace(" ", "")}`}>{initials[product]}</span>
      {compact && <small>{product}</small>}
      {!compact && <small>{product === "Coca-Cola" ? "Coca-Cola" : product}</small>}
    </button>)}
  </div>;
}

function statusClass(status: ReportStatus) {
  return status === "Validé" ? "status-approved" : status === "Refusé" ? "status-rejected" : "status-pending";
}

export default function ReportWorkspace(props: Props) {
  const {
    draft, onChange, reports, dataMode, isLight, language, onToggleTheme, onToggleLanguage,
    onSave, onClear, onRefresh, onNew, onOpen, onGoSettings, onGoReports,
    onExportCsv, onExportJson, onExportXlsx, onExportPdf, timezone,
  } = props;
  const selected = useMemo(() => {
    const [year, month, date] = draft.date.split("-").map(Number);
    return new Date(year || 2025, (month || 5) - 1, date || 21);
  }, [draft.date]);
  const [monthCursor, setMonthCursor] = useState(() => new Date(2025, 4, 1));
  const [timeText, setTimeText] = useState(() => {
    const zone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());
  });

  useEffect(() => {
    const zone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const updateClock = () => {
      setTimeText(new Intl.DateTimeFormat("fr-FR", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()));
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [timezone]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const shortcut = event.key.toUpperCase();
      const macro = MACROS.find(item => item.key === shortcut);
      if (!macro) return;
      event.preventDefault();
      onChange("complaint", macro.title);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onChange]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthCursor);
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthDays = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const [hourDisplay, minuteDisplay, secondDisplay] = timeText.split(":").map(part => part.trim());

  const selectDate = (day: number) => {
    onChange("date", `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };
  const setProduct = (product: string) => onChange("product", product);
  const applyMacro = (title: string) => onChange("complaint", title);

  return <div className="workspace-columns">
    <div className="primary-layout">
      <section className="upper-cluster">
        <div className="workspace-title">
          <div className="title-line"><h1>{language === "FR" ? "Rapport d’appel – Promotion FIFA" : "Call report – FIFA Promotion"}</h1><span className="sound-bars"><i /><i /><i /><i /></span></div>
          <p>Saisissez rapidement. Naviguez au clavier. Enregistrez avec confiance.</p>
        </div>

        <section className="glass-panel call-state-card">
          <div className="panel-heading"><PhoneCall size={15} className="red-icon" /><span>CALL STATE</span><span className="live-indicator" /></div>
          <div className="call-state-body">
            <div className="status-orbit"><div className="orbit-core"><small>ID DOSSIER</small><strong>{draft.id}</strong></div></div>
            <div className="contact-area">
              <FieldLabel>CONTACT DE CONTACT</FieldLabel>
              <div className="channel-row top-channel-row">
                {CHANNELS.map(({ name, Icon }) => <button key={name} type="button" className={`channel-button ${draft.contact_channel === name ? "selected" : ""}`} onClick={() => onChange("contact_channel", name)}>
                  <Icon size={19} strokeWidth={1.55} /><small>{name}</small>
                </button>)}
              </div>
              <button type="button" className="new-case-button" onClick={onNew}><Clock3 size={13} /> Nouveau dossier</button>
            </div>
          </div>
        </section>

        <Panel title="DATE & TIMELINE" icon={CalendarDays} className="calendar-panel">
          <div className="calendar-toolbar">
            <strong>{monthTitle}</strong>
            <div className="calendar-arrows">
              <button type="button" aria-label="Mois précédent" onClick={() => setMonthCursor(new Date(year, month - 1, 1))}><ChevronLeft size={15} /></button>
              <button type="button" aria-label="Mois suivant" onClick={() => setMonthCursor(new Date(year, month + 1, 1))}><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="calendar-grid">
            {WEEKDAYS.map(day => <span key={day} className="weekday">{day}</span>)}
            {Array.from({ length: offset }, (_, index) => <button key={`previous-${index}`} type="button" className="calendar-day muted-day" onClick={() => setMonthCursor(new Date(year, month - 1, 1))}>{previousMonthDays - offset + index + 1}</button>)}
            {Array.from({ length: monthDays }, (_, index) => {
              const day = index + 1;
              const isActive = selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
              return <button key={day} type="button" className={`calendar-day ${isActive ? "active" : ""} ${day < 3 && month === 4 ? "muted-day" : ""}`} onClick={() => selectDate(day)}>
                {day}{[1, 8, 14, 21, 29].includes(day) && <i className="day-dot" />}
              </button>;
            })}
          </div>
          <div className="calendar-foot"><span><i /> {selected.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span><span className="calendar-event-count">5 appels</span></div>
        </Panel>

        <div className="contact-timer-row">
          <section className="glass-panel contact-channel-card">
            <div className="panel-heading"><XCircle size={15} className="red-icon" /><span>CANAL DE CONTACT</span></div>
            <div className="channel-row lower-channel-row">
              {CHANNELS.map(({ name, Icon }) => <button key={name} type="button" className={`channel-button ${draft.contact_channel === name ? "selected" : ""}`} onClick={() => onChange("contact_channel", name)}>
                <Icon size={19} strokeWidth={1.55} /><small>{name}</small>
              </button>)}
            </div>
          </section>
          <div className="glass-panel timer-card" aria-live="polite" aria-label="Heure courante">
            <span>{timeText}</span>
            <small>{timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}</small>
          </div>
        </div>
      </section>

      <div className="form-grid">
        <Panel title="CLIENT PROFILE & CONTEXT" icon={UserRound} className="profile-panel">
          <div className="client-card">
            <img src="/assets/avatar-demo.png" alt="Portrait de démonstration" />
            <div className="client-name-fields">
              <input aria-label="Nom du client" value={draft.client_name} onChange={event => onChange("client_name", event.target.value)} />
              <input aria-label="Téléphone du client" value={draft.phone} onChange={event => onChange("phone", event.target.value)} />
            </div>
            <button type="button" className="client-id-button" title="Fiche client"><WalletCards size={17} /></button>
          </div>
          <div className="client-info-title">CLIENT INFO</div>
          <div className="profile-select-row"><FieldLabel>COMMUNE</FieldLabel><select value={draft.commune} onChange={event => onChange("commune", event.target.value)}><option>Yopougon</option><option>Abobo</option><option>Cocody</option><option>Marcory</option><option>Plateau</option><option>Treichville</option></select><ChevronDown size={13} /></div>
        </Panel>

        <Panel title="GAIN" icon={Trophy} className="gain-panel">
          <FieldLabel>GAIN</FieldLabel>
          <select className="dark-select full-select" value={draft.gain_name} onChange={event => onChange("gain_name", event.target.value)}><option>Gain annoncé</option><option>Gain instantané</option><option>Lot de consolation</option></select>
          <div className="gain-value">{draft.announced_gain}</div>
          <div className="gain-caption">VALEUR DU GAIN</div>
        </Panel>

        <Panel title="PARTICIPATION & ACTIONS" icon={Gift} className="actions-panel">
          <FieldLabel>PRODUIT</FieldLabel>
          <ProductTiles value={draft.product} onSelect={setProduct} compact />
          <FieldLabel>POINT DE VENTE</FieldLabel>
          <select className="dark-select full-select" value={draft.point_of_sale} onChange={event => onChange("point_of_sale", event.target.value)}><option value="">Sélectionner le point de vente</option><option>Super U Siporex</option><option>Prosuma Riviera</option><option>Carrefour Playce</option><option>Boutique du quartier</option></select>
          <div className="action-toggles"><div><FieldLabel>ACTION INTERNE</FieldLabel><Toggle checked={draft.internal_actions} onClick={() => onChange("internal_actions", !draft.internal_actions)} label={draft.internal_actions ? "Oui" : "Non"} /></div><div><FieldLabel>PARTICIPATION</FieldLabel><Toggle checked={draft.participated} onClick={() => onChange("participated", !draft.participated)} label={draft.participated ? "Oui" : "Non"} /></div></div>
          <FieldLabel>DESCRIPTION DE LA PLAINTE</FieldLabel>
          <textarea className="complaint-field" value={draft.complaint} onChange={event => onChange("complaint", event.target.value)} placeholder="Notez brièvement la plainte du client..." />
        </Panel>
        <Panel title="DÉTAILS PARTICIPATION" icon={Gift} className="participation-panel">
          <FieldLabel>PRODUIT</FieldLabel>
          <ProductTiles value={draft.product} onSelect={setProduct} />
          <div className="details-fields">
            <div><FieldLabel>CODE CAPSULE</FieldLabel><input className="dark-input" value={draft.code_capsule} onChange={event => onChange("code_capsule", event.target.value.toUpperCase())} placeholder="Ex: ABCDEFG" /></div>
            <div><FieldLabel>POINT DE VENTE</FieldLabel><select className="dark-select" value={draft.point_of_sale} onChange={event => onChange("point_of_sale", event.target.value)}><option value="">Sélectionner le point de vente</option><option>Super U Siporex</option><option>Prosuma Riviera</option><option>Carrefour Playce</option></select></div>
          </div>
        </Panel>

        <Panel title="GAIN" icon={Trophy} className="gain-detail-panel">
          <FieldLabel>GAIN ANNONCÉ</FieldLabel>
          <div className="gain-select-wrap"><select className="dark-select full-select" value={draft.announced_gain} onChange={event => onChange("announced_gain", event.target.value)}><option>5 000 FC</option><option>2 000 FC</option><option>1 000 FC</option><option>Autre</option></select><ChevronDown size={13} /></div>
          <div className="gain-status-line"><FieldLabel>STATUT DU GAIN</FieldLabel></div>
          <div className="gain-status-buttons">{(["Nul", "En cours"] as const).map(status => <button type="button" key={status} className={`gain-status ${draft.gain_status === status ? "chosen" : ""}`} onClick={() => onChange("gain_status", status)}>{status === "Nul" ? <XCircle size={12} /> : <Clock3 size={12} />}{status === "Nul" ? "Nul" : "En"}</button>)}</div>
        </Panel>
      </div>

      <Panel title="COMPLÉTION CONSOLE" icon={Shield} className="console-panel">
          <div className="console-field"><FieldLabel>PRIORITÉ</FieldLabel><select className="dark-select" value={draft.priority} onChange={event => onChange("priority", event.target.value)}><option>Normale</option><option>Haute</option><option>Basse</option></select></div>
          <div className="console-field"><FieldLabel>SUIVI</FieldLabel><Toggle checked={draft.follow_up} onClick={() => onChange("follow_up", !draft.follow_up)} label={draft.follow_up ? "Oui" : "Non"} /></div>
          <div className="console-field console-action"><FieldLabel>ACTION ENTREPRISE</FieldLabel><select className="dark-select" value={draft.company_action} onChange={event => onChange("company_action", event.target.value)}><option>Capture d’écran demandée</option><option>Réclamation transmise</option><option>Information envoyée</option><option>Aucune action</option></select></div>
          <div className="console-field console-comment"><FieldLabel>COMMENTAIRE INTERNE</FieldLabel><input className="dark-input" value={draft.internal_comment} onChange={event => onChange("internal_comment", event.target.value)} placeholder="Notes internes, remarques, suivi..." /></div>
      </Panel>

      <div className="bottom-actions">
        <button type="button" className="quiet-action" onClick={onClear}><Trash2 size={15} /> Effacer</button>
        <button type="button" className="quiet-action" onClick={onRefresh}><RefreshCw size={15} /> Rafraîchir</button>
        <button type="button" className="save-report" onClick={() => onSave(draft.duration_seconds || 0)}><SendIcon /> Enregistrer le rapport</button>
      </div>
    </div>

    <aside className="right-layout">
      <div className="theme-toolbar">
        <div className="theme-buttons"><button type="button" aria-label="Mode clair" className={isLight ? "active" : ""} onClick={onToggleTheme}><Sun size={19} /></button><button type="button" aria-label="Mode sombre" className={!isLight ? "active" : ""} onClick={onToggleTheme}><Moon size={17} /><ChevronDown size={10} /></button></div>
        <button type="button" className="language-button" onClick={onToggleLanguage}><Globe2 size={17} /><span>{language === "FR" ? "FR / EN" : "EN / FR"}</span></button>
      </div>

      <Panel title="INSIGHTS AND MACROS" icon={Zap} className="macros-panel">
        <div className="macro-list">{MACROS.map(macro => <button type="button" key={macro.key} className={`macro-button ${draft.complaint === macro.title ? "active" : ""}`} onClick={() => applyMacro(macro.title)}><span>{macro.title}</span><kbd>Ctrl + {macro.key}</kbd></button>)}</div>
      </Panel>

      <Panel title="RECENT REPORTS" icon={Clock3} className="recent-panel">
        <button type="button" className="refresh-small" onClick={onRefresh} aria-label="Actualiser les rapports"><RefreshCw size={13} /></button>
        <div className="recent-list">
          {reports.slice(0, 5).map(report => <button type="button" className="recent-item" key={report.id} onClick={() => onOpen(report)}>
            <span className="recent-details"><strong>{report.id}</strong><small>{new Date(`${report.date}T12:00:00`).toLocaleDateString("fr-FR")} • {new Date(report.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small></span>
            <span className={`status-pill ${statusClass(report.status)}`}>{report.status}</span>
          </button>)}
          {reports.length === 0 && <div className="empty-reports">Aucun rapport enregistré.</div>}
        </div>
        <div className="recent-footer"><button type="button" onClick={onGoReports}>Voir tout l’historique <ArrowRight size={15} /></button><div className="export-shortcuts"><button type="button" onClick={onExportCsv} title="Exporter CSV"><Download size={12} /> CSV</button><button type="button" onClick={onExportJson} title="Exporter JSON"><Download size={12} /> JSON</button><button type="button" onClick={onExportXlsx} title="Exporter XLSX"><Download size={12} /> XLSX</button><button type="button" onClick={onExportPdf} title="Exporter PDF"><Download size={12} /> PDF</button></div></div>
      </Panel>
      <div className={`mode-chip ${dataMode === "supabase" ? "remote" : "local"}`}><span />{dataMode === "supabase" ? "SUPABASE CONNECTÉ" : "MODE DÉMO LOCAL"}<button type="button" onClick={onGoSettings}>Paramètres</button></div>
      <div className="right-decoration" aria-hidden="true">✦</div>
    </aside>
  </div>;
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="m21 3-7.4 18-3.8-7.8L2 9.4 21 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9.8 13.2 21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
