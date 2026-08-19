<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";

  export let journalId: string;

  interface Theme {
    id: string;
    key: string;
    name: string;
    description: string | null;
  }
  interface ThemeSetting {
    themeId: string;
    settings: Record<string, string>;
  }

  let themes: Theme[] = [];
  let settingsByTheme: Record<string, Record<string, string>> = {};
  let activeThemeId = "";
  let loading = true;
  let saving = false;

  let primaryColor = "#1d4ed8";
  let secondaryColor = "#0ea5e9";
  let font = "Inter";
  let heroImageUrl = "";

  // Journal-level fields (not theme settings) — saved via PUT /journals/:id
  // separately from the theme customization below, since logo/description
  // belong to the journal record itself, not to any one theme.
  let logoUrl = "";
  let savedLogoUrl = "";
  let acronym = "";
  let savedAcronym = "";
  let description = "";
  let savedDescription = "";
  let issn = "";
  let savedIssn = "";
  let eissn = "";
  let savedEissn = "";
  let savingBranding = false;
  $: brandingDirty =
    logoUrl !== savedLogoUrl ||
    acronym !== savedAcronym ||
    description !== savedDescription ||
    issn !== savedIssn ||
    eissn !== savedEissn;

  interface MediaItem {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
  }
  let showMediaPicker = false;
  let mediaPickerTarget: "hero" | "logo" = "hero";
  let mediaItems: MediaItem[] = [];
  let mediaLoading = false;
  let uploadingLogo = false;

  async function openMediaPicker(target: "hero" | "logo") {
    mediaPickerTarget = target;
    showMediaPicker = true;
    if (mediaItems.length === 0) {
      mediaLoading = true;
      try {
        mediaItems = await api.get<MediaItem[]>(`/journals/${journalId}/media`);
      } catch (err) {
        toastError(err, "Could not load media library");
      } finally {
        mediaLoading = false;
      }
    }
  }

  function pickMedia(url: string) {
    if (mediaPickerTarget === "logo") logoUrl = url;
    else heroImageUrl = url;
    showMediaPicker = false;
  }

  async function uploadLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uploadingLogo = true;
    try {
      const uploaded = await api.upload<MediaItem>(`/journals/${journalId}/media`, file);
      logoUrl = uploaded.url;
    } catch (err) {
      toastError(err, "Could not upload logo");
    } finally {
      uploadingLogo = false;
      (e.target as HTMLInputElement).value = "";
    }
  }

  async function saveBranding() {
    savingBranding = true;
    try {
      // Sent as-is (not `|| undefined`): an empty string must actually
      // reach the API to clear a field, since an omitted key leaves the
      // existing value untouched.
      await api.put(`/journals/${journalId}`, { logoUrl, acronym, description, issn, eissn });
      savedLogoUrl = logoUrl;
      savedAcronym = acronym;
      savedDescription = description;
      savedIssn = issn;
      savedEissn = eissn;
      toasts.success("Branding saved — run a build to publish it", {
        label: "Build now",
        run: () => void buildNow(),
      });
    } catch (err) {
      toastError(err, "Could not save branding");
    } finally {
      savingBranding = false;
    }
  }

  // Mirrors the presets baked into the static site's theme layer, so the
  // preview here matches what a build actually produces.
  const THEME_PRESETS: Record<string, { primary: string; secondary: string; font: string }> = {
    default: { primary: "#1d4ed8", secondary: "#0ea5e9", font: "Inter" },
    modern: { primary: "#7c3aed", secondary: "#ec4899", font: "Inter" },
    journal: { primary: "#7f1d1d", secondary: "#92400e", font: "Georgia" },
  };

  const FONT_OPTIONS = ["Inter", "Roboto", "Open Sans", "Lato", "Source Sans 3", "Merriweather", "Georgia"];

  const COLOR_SWATCHES = [
    "#1d4ed8", "#2563eb", "#0ea5e9", "#0e9f6e", "#7c3aed",
    "#db2777", "#dc2626", "#ea580c", "#ca8a04", "#0f172a",
  ];

  $: activeTheme = themes.find((t) => t.id === activeThemeId) ?? null;
  // Fixed key order on both sides: JSON.stringify is order-sensitive, and
  // older saved settings predate heroImageUrl, so it must be defaulted
  // rather than merely spread (spread order would depend on whichever keys
  // happen to already be in the saved object).
  function settingsFingerprint(s: Partial<Record<string, string>> | undefined) {
    return JSON.stringify({
      primaryColor: s?.primaryColor ?? "",
      secondaryColor: s?.secondaryColor ?? "",
      font: s?.font ?? "",
      heroImageUrl: s?.heroImageUrl ?? "",
    });
  }
  $: dirty =
    activeTheme !== null &&
    settingsFingerprint(settingsByTheme[activeThemeId]) !==
      settingsFingerprint({ primaryColor, secondaryColor, font, heroImageUrl });

  interface JournalBranding {
    themeId: string | null;
    logoUrl: string | null;
    acronym: string | null;
    description: string | null;
    issn: string | null;
    eissn: string | null;
  }

  async function load() {
    loading = true;
    try {
      themes = await api.get<Theme[]>("/themes");
      const [journal, settings] = await Promise.all([
        api.get<JournalBranding>(`/journals/${journalId}`),
        api.get<ThemeSetting[]>(`/journals/${journalId}/theme-settings`),
      ]);

      settingsByTheme = Object.fromEntries(settings.map((s) => [s.themeId, s.settings]));
      activeThemeId = journal.themeId ?? themes[0]?.id ?? "";
      applyThemeFields(activeThemeId);

      logoUrl = savedLogoUrl = journal.logoUrl ?? "";
      acronym = savedAcronym = journal.acronym ?? "";
      description = savedDescription = journal.description ?? "";
      issn = savedIssn = journal.issn ?? "";
      eissn = savedEissn = journal.eissn ?? "";
    } catch (err) {
      toastError(err, "Could not load theme settings");
    } finally {
      loading = false;
    }
  }

  /** Loads saved overrides for a theme, falling back to that theme's preset. */
  function applyThemeFields(themeId: string) {
    const saved = settingsByTheme[themeId];
    const preset = THEME_PRESETS[themes.find((t) => t.id === themeId)?.key ?? "default"] ??
      THEME_PRESETS.default;
    primaryColor = saved?.primaryColor ?? preset.primary;
    secondaryColor = saved?.secondaryColor ?? preset.secondary;
    font = saved?.font ?? preset.font;
    heroImageUrl = saved?.heroImageUrl ?? "";
  }

  function selectTheme(themeId: string) {
    activeThemeId = themeId;
    applyThemeFields(themeId);
  }

  function resetToPreset() {
    const preset = THEME_PRESETS[activeTheme?.key ?? "default"] ?? THEME_PRESETS.default;
    primaryColor = preset.primary;
    secondaryColor = preset.secondary;
    font = preset.font;
  }

  async function save() {
    if (!activeThemeId) return;
    saving = true;
    try {
      await api.put(`/journals/${journalId}/theme-settings`, {
        themeId: activeThemeId,
        settings: { primaryColor, secondaryColor, font, heroImageUrl },
      });
      settingsByTheme[activeThemeId] = { primaryColor, secondaryColor, font, heroImageUrl };
      settingsByTheme = settingsByTheme;
      toasts.success("Theme saved — run a build to publish it", {
        label: "Build now",
        run: () => void buildNow(),
      });
    } catch (err) {
      toastError(err, "Could not save theme");
    } finally {
      saving = false;
    }
  }

  async function buildNow() {
    try {
      await api.post(`/journals/${journalId}/build`);
      toasts.info("Build queued");
    } catch (err) {
      toastError(err, "Could not queue build");
    }
  }

  onMount(load);
</script>

{#if loading}
  <div class="card"><div class="card-body"><p class="muted">Loading themes…</p></div></div>
{:else}
  <div class="layout">
    <div class="col">
      <div class="card">
        <div class="card-header">
          <h2>Branding</h2>
        </div>
        <div class="card-body customize">
          <div class="field">
            <label for="logo-upload">Logo</label>
            <div class="logo-row">
              {#if logoUrl}
                <div class="logo-preview">
                  <img src={logoUrl} alt="Logo" />
                  <button type="button" class="btn btn-ghost btn-sm remove-logo" on:click={() => (logoUrl = "")}>
                    ✕
                  </button>
                </div>
              {:else}
                <div class="logo-preview empty" aria-hidden="true">No logo</div>
              {/if}
              <div class="logo-actions">
                <label class="btn btn-secondary btn-sm upload-btn">
                  {uploadingLogo ? "Uploading…" : "Upload…"}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    on:change={uploadLogo}
                    disabled={uploadingLogo}
                  />
                </label>
                <button type="button" class="btn btn-secondary btn-sm" on:click={() => openMediaPicker("logo")}>
                  Choose from media…
                </button>
              </div>
            </div>
            <span class="field-hint">Shown in the site header and nav. Square images work best.</span>
          </div>

          <div class="field">
            <label for="acronym">Acronym</label>
            <input id="acronym" bind:value={acronym} placeholder="e.g. J-AGT" />
          </div>

          <div class="field">
            <label for="description">Description / tagline</label>
            <input id="description" bind:value={description} placeholder="Shown under the journal name on the homepage" />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="issn">p-ISSN</label>
              <input id="issn" bind:value={issn} placeholder="1978-1555" />
            </div>
            <div class="field">
              <label for="eissn">e-ISSN</label>
              <input id="eissn" bind:value={eissn} placeholder="2502-4906" />
            </div>
          </div>

          <div class="save-row">
            <button class="btn btn-primary" on:click={saveBranding} disabled={savingBranding || !brandingDirty}>
              {#if savingBranding}<span class="spinner"></span>{/if}
              {savingBranding ? "Saving…" : brandingDirty ? "Save branding" : "Saved"}
            </button>
            {#if brandingDirty}<span class="muted unsaved">Unsaved changes</span>{/if}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Theme</h2></div>
        <div class="card-body theme-list">
          {#each themes as theme (theme.id)}
            <button
              type="button"
              class="theme-option"
              class:selected={activeThemeId === theme.id}
              on:click={() => selectTheme(theme.id)}
            >
              <span
                class="swatch-pair"
                style={`--a:${(THEME_PRESETS[theme.key] ?? THEME_PRESETS.default).primary};--b:${(THEME_PRESETS[theme.key] ?? THEME_PRESETS.default).secondary}`}
              ></span>
              <span class="theme-meta">
                <strong>{theme.name}</strong>
                {#if theme.description}<span class="muted">{theme.description}</span>{/if}
              </span>
              {#if activeThemeId === theme.id}<span class="check">✓</span>{/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Customize</h2>
          <button class="btn btn-ghost btn-sm" on:click={resetToPreset}>Reset to preset</button>
        </div>
        <div class="card-body customize">
          <div class="field">
            <label for="primary">Primary color</label>
            <div class="color-row">
              <input id="primary" type="color" bind:value={primaryColor} />
              <input class="hex mono" bind:value={primaryColor} aria-label="Primary color hex" />
            </div>
            <div class="swatches">
              {#each COLOR_SWATCHES as swatch (swatch)}
                <button
                  type="button"
                  class="swatch"
                  style={`background:${swatch}`}
                  aria-label={`Use ${swatch}`}
                  on:click={() => (primaryColor = swatch)}
                ></button>
              {/each}
            </div>
          </div>

          <div class="field">
            <label for="secondary">Secondary color</label>
            <div class="color-row">
              <input id="secondary" type="color" bind:value={secondaryColor} />
              <input class="hex mono" bind:value={secondaryColor} aria-label="Secondary color hex" />
            </div>
            <span class="field-hint">Used for gradients and accents.</span>
          </div>

          <div class="field">
            <label for="hero-image">Hero image</label>
            {#if heroImageUrl}
              <div class="hero-preview">
                <img src={heroImageUrl} alt="Hero" />
                <button type="button" class="btn btn-ghost btn-sm remove-hero" on:click={() => (heroImageUrl = "")}>
                  Remove
                </button>
              </div>
            {/if}
            <div class="hero-row">
              <input id="hero-image" bind:value={heroImageUrl} placeholder="https://…/banner.jpg" />
              <button type="button" class="btn btn-secondary btn-sm" on:click={() => openMediaPicker("hero")}>
                Choose…
              </button>
            </div>
            <span class="field-hint">Shown behind the homepage hero, above the theme gradient.</span>
          </div>

          <div class="field">
            <label for="font">Font family</label>
            <select id="font" bind:value={font}>
              {#each FONT_OPTIONS as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
            <span class="field-hint">Applied site-wide with a system fallback.</span>
          </div>

          <div class="save-row">
            <button class="btn btn-primary" on:click={save} disabled={saving || !dirty}>
              {#if saving}<span class="spinner"></span>{/if}
              {saving ? "Saving…" : dirty ? "Save theme" : "Saved"}
            </button>
            {#if dirty}<span class="muted unsaved">Unsaved changes</span>{/if}
          </div>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="card preview-card">
        <div class="card-header">
          <h2>Live preview</h2>
          <span class="pill pill-neutral">Approximation</span>
        </div>
        <div class="card-body">
          <div
            class="preview"
            style={`--p:${primaryColor};--s:${secondaryColor};--f:'${font}', system-ui, sans-serif`}
          >
            <div class="pv-header">
              <span class="pv-brand">
                {#if logoUrl}<img src={logoUrl} alt="" class="pv-logo" />{/if}
                {acronym || "Journal Name"}
              </span>
              <span class="pv-nav">
                <span>Home</span><span>About</span><span>Issues</span>
                <span class="pv-cta">Submit</span>
              </span>
            </div>
            <div
              class="pv-hero"
              style={heroImageUrl
                ? `background-image:linear-gradient(135deg, rgba(15,23,42,.72), rgba(15,23,42,.45)), url('${heroImageUrl}')`
                : ""}
            >
              <strong>{acronym || "Jurnal Example"}</strong>
              <span>{description || "A peer-reviewed, open-access journal"}</span>
              <span class="pv-btn">Submit Your Article</span>
            </div>
            <div class="pv-body">
              <h4>About the Journal</h4>
              <p>
                Body text renders in the selected font. Links and accents follow the primary color you
                picked above.
              </p>
              <div class="pv-cards">
                <div class="pv-card"><span class="pv-line w80"></span><span class="pv-line w60"></span></div>
                <div class="pv-card"><span class="pv-line w70"></span><span class="pv-line w50"></span></div>
              </div>
            </div>
          </div>
          <p class="muted preview-note">
            The published site is generated by a build. Save your changes, then run a build to make them
            live.
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showMediaPicker}
  <div class="dialog-scrim">
    <button type="button" class="dialog-hit" aria-label="Close" on:click={() => (showMediaPicker = false)}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Choose image">
      <h3>Choose {mediaPickerTarget === "logo" ? "logo" : "hero image"}</h3>
      {#if mediaLoading}
        <p class="muted">Loading media…</p>
      {:else if mediaItems.filter((m) => m.mimeType.startsWith("image/")).length === 0}
        <p class="muted">No images in the media library yet — upload one from the Media tab.</p>
      {:else}
        <div class="media-grid">
          {#each mediaItems.filter((m) => m.mimeType.startsWith("image/")) as item (item.id)}
            <button type="button" class="media-item" on:click={() => pickMedia(item.url)}>
              <img src={item.url} alt={item.fileName} />
              <span>{item.fileName}</span>
            </button>
          {/each}
        </div>
      {/if}
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" on:click={() => (showMediaPicker = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 1rem;
    align-items: start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .theme-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .theme-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
    text-align: left;
    font: inherit;
  }
  .theme-option:hover {
    border-color: var(--border-strong);
  }
  .theme-option.selected {
    border-color: var(--brand-500);
    background: var(--brand-50);
  }
  .swatch-pair {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--a), var(--b));
    flex-shrink: 0;
  }
  .theme-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
    flex: 1;
    min-width: 0;
  }
  .theme-meta span {
    font-size: 0.75rem;
  }
  .check {
    color: var(--brand-600);
    font-weight: 700;
  }

  .customize {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .color-row {
    display: flex;
    gap: 0.5rem;
  }
  .color-row input[type="color"] {
    width: 3rem;
    flex-shrink: 0;
  }
  .hex {
    flex: 1;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.15rem;
  }
  .swatch {
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 0.3rem;
    border: 1px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
    padding: 0;
  }
  .swatch:hover {
    transform: scale(1.12);
  }
  .save-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .unsaved {
    font-size: 0.8125rem;
  }

  .hero-row {
    display: flex;
    gap: 0.5rem;
  }
  .hero-preview {
    position: relative;
    margin-bottom: 0.4rem;
  }
  .hero-preview img {
    width: 100%;
    height: 6rem;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .remove-hero {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    background: rgba(17, 24, 39, 0.65);
    color: #fff;
  }
  .remove-hero:hover {
    background: rgba(17, 24, 39, 0.85);
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }
  .logo-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .logo-preview {
    position: relative;
    flex-shrink: 0;
    width: 4rem;
    height: 4rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: var(--surface-2);
  }
  .logo-preview.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--fg-subtle);
    font-size: 0.6875rem;
    text-align: center;
    padding: 0.25rem;
  }
  .remove-logo {
    position: absolute;
    top: 0.1rem;
    right: 0.1rem;
    min-width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    background: rgba(17, 24, 39, 0.65);
    color: #fff;
  }
  .remove-logo:hover {
    background: rgba(17, 24, 39, 0.85);
  }
  .logo-actions {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .upload-btn {
    position: relative;
    overflow: hidden;
    text-align: center;
    cursor: pointer;
  }
  .upload-btn input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    padding: 0;
    border: none;
  }

  .dialog-scrim {
    position: fixed;
    inset: 0;
    z-index: 160;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .dialog-hit {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    border: none;
    cursor: default;
  }
  .dialog {
    position: relative;
    width: min(30rem, 100%);
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: 0.5rem;
    max-height: 18rem;
    overflow-y: auto;
    padding: 0.15rem;
  }
  .media-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.3rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--fg-muted);
    text-align: left;
  }
  .media-item:hover {
    border-color: var(--brand-500);
  }
  .media-item img {
    width: 100%;
    height: 4.5rem;
    object-fit: cover;
    border-radius: 0.2rem;
  }
  .media-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ----- preview ----- */
  .preview {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    font-family: var(--f);
  }
  .pv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    background: #fff;
    border-bottom: 1px solid var(--border);
    font-size: 0.7rem;
  }
  .pv-brand {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
  }
  .pv-logo {
    width: 1.1rem;
    height: 1.1rem;
    object-fit: contain;
    border-radius: 0.2rem;
  }
  .pv-nav {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--fg-muted);
  }
  .pv-cta {
    background: var(--p);
    color: #fff;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
  }
  .pv-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 1.6rem 1rem;
    background: linear-gradient(135deg, var(--p), var(--s));
    background-size: cover;
    background-position: center;
    color: #fff;
    text-align: center;
  }
  .pv-hero strong {
    font-size: 1.05rem;
  }
  .pv-hero span {
    font-size: 0.72rem;
    opacity: 0.92;
  }
  .pv-btn {
    margin-top: 0.4rem;
    background: #fff;
    color: var(--p);
    font-weight: 700;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    font-size: 0.7rem !important;
    opacity: 1 !important;
  }
  .pv-body {
    padding: 0.9rem 1rem 1.1rem;
    background: #fff;
  }
  .pv-body h4 {
    margin-bottom: 0.35rem;
    font-size: 0.8rem;
  }
  .pv-body p {
    font-size: 0.72rem;
    color: var(--fg-muted);
    line-height: 1.6;
  }
  .pv-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .pv-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
  }
  .pv-line {
    height: 0.4rem;
    border-radius: 999px;
    background: var(--p);
    opacity: 0.25;
  }
  .w80 {
    width: 80%;
  }
  .w70 {
    width: 70%;
  }
  .w60 {
    width: 60%;
  }
  .w50 {
    width: 50%;
  }
  .preview-note {
    margin-top: 0.75rem;
    font-size: 0.75rem;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
