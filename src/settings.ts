import { PluginSettingTab, Setting, App } from "obsidian";
import { SCHEMES, SCHEME_LABELS, NUM_COLORS, type PluginSettings, type SchemeKey } from "./types";
import { getColorValue, getTextColorValue } from "./colorUtils";
import { HexInputModal } from "./modal";
import { t } from "./i18n";
import type ColorfulTagsPlugin from "./main";

export class ColorfulTagsSettingTab extends PluginSettingTab {
  plugin: ColorfulTagsPlugin;

  constructor(app: App, plugin: ColorfulTagsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderSchemeSection(containerEl);
    this.renderDictSection(containerEl);
  }

  private renderSchemeSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setHeading()
      .setName(t("Scheme settings"))
      .setDesc(t("Click color block to edit"));

    for (const key of SCHEMES) {
      const label = t(SCHEME_LABELS[key] as keyof ReturnType<typeof import("./locale/en").default>);
      const row = containerEl.createDiv();
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        padding: "6px 0",
      });

      const nameEl = row.createDiv();
      Object.assign(nameEl.style, {
        width: "100px",
        fontSize: "0.9em",
        color: "var(--text-muted)",
      });
      nameEl.textContent = label;

      const blocks = row.createDiv();
      Object.assign(blocks.style, { display: "flex", gap: "4px", flex: "1" });

      for (let i = 1; i <= NUM_COLORS; i++) {
        const bg = getColorValue(i, key, this.plugin.settings.schemeColors);
        const tx = getTextColorValue(i, key, this.plugin.settings.schemeTextColors);
        const block = blocks.createDiv();
        Object.assign(block.style, {
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          background: bg,
          color: tx,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8em",
          fontWeight: "bold",
          border: "2px solid var(--background-modifier-border, #555)",
          boxSizing: "border-box",
          cursor: "pointer",
          transition: "transform 0.15s",
        });
        block.textContent = String(i);

        block.addEventListener("mouseenter", () => {
          block.style.transform = "scale(1.15)";
        });
        block.addEventListener("mouseleave", () => {
          block.style.transform = "scale(1)";
        });

        const schemeKey = key;
        const colorIdx = i;
        block.addEventListener("click", () => {
          const currentBg = getColorValue(colorIdx, schemeKey, this.plugin.settings.schemeColors);
          const currentText = getTextColorValue(colorIdx, schemeKey, this.plugin.settings.schemeTextColors);
          const modal = new HexInputModal(
            this.app,
            schemeKey,
            colorIdx,
            currentBg,
            currentText,
            (bg2: string, tx2: string) => {
              if (!this.plugin.settings.schemeColors[schemeKey]) {
                this.plugin.settings.schemeColors[schemeKey] = {};
              }
              if (!this.plugin.settings.schemeTextColors[schemeKey]) {
                this.plugin.settings.schemeTextColors[schemeKey] = {};
              }
              this.plugin.settings.schemeColors[schemeKey][colorIdx] = bg2;
              this.plugin.settings.schemeTextColors[schemeKey][colorIdx] = tx2;
              this.plugin.saveSettings();
              this.plugin.refreshAllStyleRules();
              this.plugin.applyEditorViewTags();
              this.display();
            }
          );
          modal.open();
        });
      }

      const isActive = this.plugin.settings.activeScheme === key;

      const resetBtn = row.createEl("button", { text: t("Reset") });
      Object.assign(resetBtn.style, { fontSize: "0.85em" });
      resetBtn.addEventListener("click", () => {
        delete this.plugin.settings.schemeColors[key];
        delete this.plugin.settings.schemeTextColors[key];
        this.plugin.saveSettings();
        this.plugin.refreshAllStyleRules();
        this.plugin.applyEditorViewTags();
        this.display();
      });

      const btn = row.createEl("button");
      btn.textContent = isActive ? t("Active") : t("Enable");
      Object.assign(btn.style, { width: "80px", fontSize: "0.85em" });
      if (isActive) btn.classList.add("mod-cta");

      btn.addEventListener("click", () => {
        if (isActive) return;
        this.plugin.settings.activeScheme = key;
        this.plugin.saveSettings();
        this.plugin.refreshAllStyleRules();
        this.plugin.applyEditorViewTags();
        this.display();
      });
    }
  }

  private renderDictSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setHeading()
      .setName(t("Tag dictionary"))
      .setDesc(t("Tag dictionary desc"));

    const byColor: Record<number, string[]> = {};
    for (let i = 1; i <= NUM_COLORS; i++) byColor[i] = [];
    for (const entry of this.plugin.settings.tagDict) {
      if (entry.length > 1 && byColor[entry[0]]) {
        byColor[entry[0]] = entry.slice(1);
      }
    }

    for (let i = 1; i <= NUM_COLORS; i++) {
      const row = containerEl.createDiv();
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
      });

      const block = row.createDiv();
      Object.assign(block.style, {
        width: "28px",
        height: "28px",
        borderRadius: "4px",
        flexShrink: "0",
        background: getColorValue(i, this.plugin.settings.activeScheme, this.plugin.settings.schemeColors),
        color: getTextColorValue(i, this.plugin.settings.activeScheme, this.plugin.settings.schemeTextColors),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75em",
        fontWeight: "bold",
      });
      block.textContent = String(i);

      const input = row.createEl("input", { type: "text" });
      Object.assign(input.style, { flex: "1", fontSize: "0.9em" });
      input.value = byColor[i].join(", ");
      input.placeholder = "tag1,tag2";

      const colorIdx = i;
      input.addEventListener("change", () => {
        const names = input.value
          .split(/[,，\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        this.plugin.settings.tagDict = this.plugin.settings.tagDict.filter(
          (e) => e[0] !== colorIdx
        );
        if (names.length > 0) {
          this.plugin.settings.tagDict.push([colorIdx, ...names]);
        }
        this.plugin.saveSettings();
        this.plugin.refreshAllStyleRules();
        this.plugin.applyEditorViewTags();
      });
    }
  }
}
