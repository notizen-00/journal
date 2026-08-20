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
    "--theme-surface": "#f1f5f9",
    "--theme-font": "'Inter', system-ui, sans-serif",
  },
  journal: {
    "--theme-primary": "#7f1d1d",
    "--theme-secondary": "#92400e",
    "--theme-fg": "#1c1917",
    "--theme-muted": "#78716c",
    "--theme-border": "#d6d3d1",
    "--theme-surface": "#f5f5f4",
    "--theme-font": "'Georgia', 'Times New Roman', serif",
  },
};

/**
 * ThemeSetting.themeId holds the Theme's uuid, so it must be matched
 * against the journal's themeId — not against the theme's `key` slug,
 * which never matches and silently discarded every per-journal override.
 */
export function getThemeSettings(journal: JournalData): Record<string, string> | undefined {
  return journal.themeSettings.find((s) => s.themeId === journal.themeId)?.settings as
    | Record<string, string>
    | undefined;
}

export function resolveThemeVars(journal: JournalData): string {
  const key = journal.theme?.key ?? "default";
  const vars = { ...(presets[key] ?? presets.default) };
  const settings = getThemeSettings(journal);

  if (settings?.heroImageUrl) vars["--theme-hero-image"] = `url('${settings.heroImageUrl}')`;
  if (settings?.primaryColor) vars["--theme-primary"] = settings.primaryColor;
  if (settings?.secondaryColor) vars["--theme-secondary"] = settings.secondaryColor;
  if (settings?.font) {
    // Editors pick a family name ("Inter"), not a full stack — keep a
    // fallback so a font that fails to load doesn't drop to the browser default.
    const family = settings.font.trim();
    vars["--theme-font"] = family.includes(",")
      ? family
      : `'${family.replace(/^['"]|['"]$/g, "")}', system-ui, sans-serif`;
  }

  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
