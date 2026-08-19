import type { JournalData } from "$lib/api";

/**
 * Theme presets (PRD §14 - themes/default, modern, journal). Each is a set
 * of CSS custom properties; per-journal ThemeSettings (PRD §15) can override
 * individual values (primaryColor, secondaryColor, font) without touching
 * theme source code.
 */
const presets: Record<string, Record<string, string>> = {
  default: {
    "--theme-primary": "#1d4ed8",
    "--theme-secondary": "#0ea5e9",
    "--theme-fg": "#111827",
    "--theme-muted": "#6b7280",
    "--theme-border": "#e5e7eb",
    "--theme-surface": "#f8fafc",
    "--theme-font": "'Inter', system-ui, sans-serif",
  },
  modern: {
    "--theme-primary": "#7c3aed",
    "--theme-secondary": "#ec4899",
    "--theme-fg": "#0f172a",
    "--theme-muted": "#64748b",
    "--theme-border": "#1e293b",
    "--theme-font": "'Inter', system-ui, sans-serif",
  },
  journal: {
    "--theme-primary": "#7f1d1d",
    "--theme-secondary": "#92400e",
    "--theme-fg": "#1c1917",
    "--theme-muted": "#78716c",
    "--theme-border": "#d6d3d1",
    "--theme-font": "'Georgia', 'Times New Roman', serif",
  },
};

export function resolveThemeVars(journal: JournalData): string {
  const key = journal.theme?.key ?? "default";
  const vars = { ...(presets[key] ?? presets.default) };

  const settings = journal.themeSettings.find((s) => s.themeId === journal.theme?.key)?.settings as
    | Record<string, string>
    | undefined;

  if (settings?.primaryColor) vars["--theme-primary"] = settings.primaryColor;
  if (settings?.secondaryColor) vars["--theme-secondary"] = settings.secondaryColor;
  if (settings?.font) vars["--theme-font"] = settings.font;

  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
