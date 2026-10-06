import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { CallReport, SupabaseConfig } from "@/types/report";

const REPORTS_KEY = "fifa-promo.reports.v1";
const SUPABASE_KEY = "fifa-promo.supabase.v1";

export const DEMO_REPORTS: CallReport[] = [
  {
    id: "CCF25021-0016", created_at: "2025-05-21T18:32:00.000Z", date: "2025-05-21",
    contact_channel: "Appel", client_name: "Aminata Koné", phone: "07 08 34 61 12", commune: "Yopougon",
    gain_name: "Gain annoncé", announced_gain: "5 000 FC", gain_status: "Payé", product: "Coca-Cola",
    point_of_sale: "Super U Siporex", code_capsule: "AB7C9F", participated: true, internal_actions: true,
    complaint: "Le code a été reconnu après une seconde tentative.", priority: "Normale", follow_up: true,
    company_action: "Capture d’écran demandée", internal_comment: "Dossier complet — retour confirmé.", status: "Validé", duration_seconds: 3265,
  },
  {
    id: "CCF25021-0015", created_at: "2025-05-21T17:48:00.000Z", date: "2025-05-21",
    contact_channel: "WhatsApp", client_name: "Kouamé Yao", phone: "05 44 20 91 68", commune: "Abobo",
    gain_name: "Gain annoncé", announced_gain: "5 000 FC", gain_status: "En cours", product: "Fanta",
    point_of_sale: "Prosuma Riviera", code_capsule: "FC2A8D", participated: true, internal_actions: false,
    complaint: "Le gain n’apparaît pas dans l’application.", priority: "Haute", follow_up: true,
    company_action: "Réclamation transmise", internal_comment: "Vérifier le remboursement.", status: "En attente", duration_seconds: 1830,
  },
  {
    id: "CCF25021-0014", created_at: "2025-05-21T18:11:00.000Z", date: "2025-05-21",
    contact_channel: "Appel", client_name: "Mariam Traoré", phone: "01 02 55 73 80", commune: "Cocody",
    gain_name: "Gain annoncé", announced_gain: "2 000 FC", gain_status: "Payé", product: "Sprite",
    point_of_sale: "Carrefour Playce", code_capsule: "SP81D2", participated: true, internal_actions: true,
    complaint: "La cliente souhaite retrouver le point de vente le plus proche.", priority: "Normale", follow_up: false,
    company_action: "Information envoyée", internal_comment: "Résolu pendant l’appel.", status: "Validé", duration_seconds: 1142,
  },
  {
    id: "CCF25021-0013", created_at: "2025-05-21T15:02:00.000Z", date: "2025-05-21",
    contact_channel: "SMS", client_name: "Jean N’Guessan", phone: "07 12 34 56 78", commune: "Yopougon",
    gain_name: "Gain annoncé", announced_gain: "5 000 FC", gain_status: "Nul", product: "Coca-Cola",
    point_of_sale: "", code_capsule: "", participated: false, internal_actions: false,
    complaint: "Le code est illisible.", priority: "Haute", follow_up: true,
    company_action: "Aucune action", internal_comment: "Nouvelle photo demandée au client.", status: "Refusé", duration_seconds: 905,
  },
  {
    id: "CCF25021-0012", created_at: "2025-05-21T14:22:00.000Z", date: "2025-05-21",
    contact_channel: "Facebook", client_name: "Yves Kouassi", phone: "07 07 65 32 10", commune: "Marcory",
    gain_name: "Gain annoncé", announced_gain: "1 000 FC", gain_status: "Payé", product: "Fanta",
    point_of_sale: "Boutique du quartier", code_capsule: "FT60P3", participated: true, internal_actions: true,
    complaint: "Demande d’information sur la promotion.", priority: "Normale", follow_up: false,
    company_action: "Réponse envoyée", internal_comment: "Le client a reçu les règles du jeu.", status: "Validé", duration_seconds: 672,
  },
];

export function makeBlankReport(sequence = 17, durationSeconds = 0): CallReport {
  return {
    id: `CCF25021-${String(sequence).padStart(4, "0")}`,
    created_at: new Date().toISOString(), date: "2025-05-21", contact_channel: "Appel",
    client_name: "Jean N’Guessan", phone: "07 12 34 56 78", commune: "Yopougon",
    gain_name: "Gain annoncé", announced_gain: "5 000 FC", gain_status: "Nul", product: "Coca-Cola",
    point_of_sale: "", code_capsule: "", participated: true, internal_actions: true,
    complaint: "", priority: "Normale", follow_up: true, company_action: "Capture d’écran demandée",
    internal_comment: "", status: "En attente", duration_seconds: durationSeconds,
  };
}

export function loadLocalReports(): CallReport[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CallReport[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // A damaged local cache must not block the demonstration screen.
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(DEMO_REPORTS));
  return DEMO_REPORTS;
}

export function persistLocalReports(reports: CallReport[]) {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    console.warn("La sauvegarde locale est indisponible.", error);
  }
}

export function readSupabaseConfig(): SupabaseConfig {
  try {
    const value = localStorage.getItem(SUPABASE_KEY);
    if (value) {
      const parsed = JSON.parse(value) as Partial<SupabaseConfig>;
      return {
        url: parsed.url ?? "",
        anonKey: parsed.anonKey ?? "",
        table: parsed.table ?? "call_reports",
        timezone: parsed.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      };
    }
  } catch {
    // Ignore malformed settings and remain in local mode.
  }
  return { url: "", anonKey: "", table: "call_reports", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC" };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_KEY, JSON.stringify(config));
}

export function isSupabaseConfigured(config: SupabaseConfig) {
  return Boolean(config.url.trim() && config.anonKey.trim() && config.table.trim());
}

function endpoint(config: SupabaseConfig, query = "") {
  const base = config.url.trim().replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) && !/^https?:\/\//i.test(base)) {
    throw new Error("Saisissez une URL Supabase valide.");
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.table.trim())) {
    throw new Error("Le nom de table doit contenir uniquement lettres, chiffres et soulignements.");
  }
  return `${base}/rest/v1/${encodeURIComponent(config.table.trim())}${query}`;
}

function headers(config: SupabaseConfig): HeadersInit {
  return {
    apikey: config.anonKey.trim(),
    Authorization: `Bearer ${config.anonKey.trim()}`,
    "Content-Type": "application/json",
  };
}

async function expectOkay(response: Response) {
  if (response.ok) return;
  const details = await response.text().catch(() => "");
  let friendly = details;
  try {
    const payload = JSON.parse(details) as { message?: string; details?: string; hint?: string };
    friendly = [payload.message, payload.details, payload.hint].filter(Boolean).join(" — ");
  } catch {
    // Keep the raw response only if the server did not return JSON.
  }
  throw new Error(friendly || `Erreur Supabase (${response.status}).`);
}

export async function testSupabaseConnection(config: SupabaseConfig) {
  const response = await fetch(endpoint(config, "?select=*&limit=1"), { headers: headers(config) });
  await expectOkay(response);
  return "Connexion réussie : la table est accessible avec la clé anon/public.";
}

export async function fetchSupabaseReports(config: SupabaseConfig): Promise<CallReport[]> {
  const response = await fetch(endpoint(config, "?select=*&order=created_at.desc"), { headers: headers(config) });
  await expectOkay(response);
  return (await response.json()) as CallReport[];
}

export async function upsertSupabaseReport(config: SupabaseConfig, report: CallReport) {
  const response = await fetch(endpoint(config, "?on_conflict=id"), {
    method: "POST",
    headers: { ...headers(config), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(report),
  });
  await expectOkay(response);
}

function cell(value: unknown) {
  const text = value == null ? "" : typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

const CSV_FIELDS: Array<[keyof CallReport, string]> = [
  ["id", "Identifiant"], ["created_at", "Créé le"], ["date", "Date"], ["contact_channel", "Canal"],
  ["client_name", "Client"], ["phone", "Téléphone"], ["commune", "Commune"], ["gain_name", "Gain"],
  ["announced_gain", "Gain annoncé"], ["gain_status", "Statut du gain"], ["product", "Produit"],
  ["point_of_sale", "Point de vente"], ["code_capsule", "Code capsule"], ["participated", "Participation"],
  ["internal_actions", "Actions internes"], ["complaint", "Plainte"], ["priority", "Priorité"],
  ["follow_up", "Suivi"], ["company_action", "Action entreprise"], ["internal_comment", "Commentaire interne"],
  ["status", "Statut du rapport"], ["duration_seconds", "Durée (secondes)"],
];

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export function exportReportsCsv(reports: CallReport[]) {
  const rows = [CSV_FIELDS.map(([, label]) => cell(label)).join(","), ...reports.map(report => CSV_FIELDS.map(([key]) => cell(report[key])).join(","))];
  download(`fifa-promo-rapports-${stamp()}.csv`, `\uFEFF${rows.join("\r\n")}`, "text/csv;charset=utf-8");
}

export function exportReportsJson(reports: CallReport[]) {
  download(`fifa-promo-rapports-${stamp()}.json`, JSON.stringify(reports, null, 2), "application/json;charset=utf-8");
}

export function exportReportsXlsx(reports: CallReport[]) {
  const rows = reports.map((report) => {
    const row: Record<string, string | number | boolean | null> = {};
    for (const [key, label] of CSV_FIELDS) {
      const value = report[key];
      row[label] = value == null ? "" : typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);
    }
    return row;
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Rapports");
  XLSX.writeFile(workbook, `fifa-promo-rapports-${stamp()}.xlsx`);
}

export function exportReportsPdf(reports: CallReport[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text("FIFA Promo — Rapports d’appel", 14, 16);

  const body = reports.map((report) => CSV_FIELDS.map(([key]) => {
    const value = report[key];
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (value == null) return "";
    return String(value);
  }));

  autoTable(doc, {
    head: [CSV_FIELDS.map(([, label]) => label)],
    body,
    startY: 22,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 37, 63], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`fifa-promo-rapports-${stamp()}.pdf`);
}
