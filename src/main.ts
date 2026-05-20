import { Plugin } from "obsidian";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_SETTINGS,
  SCHEMES,
  type PluginSettings,
  type TagDictEntry,
} from "./types";
import { migrateDict, getColor, getTextColor, escapeCssSelector } from "./colorUtils";
import { TagPopup } from "./popup";
import { ColorfulTagsSettingTab } from "./settings";
import { t } from "./i18n";

export default class ColorfulTagsPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private styleTag: HTMLStyleElement | null = null;
  private styleRules: Map<string, { bg: string; text: string }> = new Map();
  private observer: MutationObserver | null = null;
  private popup: TagPopup | null = null;

  async onload(): Promise<void> {
    this.createStyleTag();
    this.loadSettingsSync();

    this.addSettingTab(new ColorfulTagsSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.applyAllColors())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.applyAllColors())
    );

    this.applyAllColors();
    this.registerObserver();

    await this.loadSettings();
    this.applyAllColors();

    this.popup = new TagPopup({
      getSettings: () => ({
        tagDict: this.settings.tagDict,
        activeScheme: this.settings.activeScheme,
        schemeColors: this.settings.schemeColors,
      }),
      onColorChange: (tagName, colorIndex) => this.onPopupColorChange(tagName, colorIndex),
    });
    this.popup.create();
  }

  onunload(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.removeStyleTag();
    this.clearEditorColors();
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
  }

  private processSettings(data: Record<string, unknown> | null): PluginSettings {
    const raw: PluginSettings = Object.assign({}, DEFAULT_SETTINGS, data);
    raw.tagDict = migrateDict(raw.tagDict);
    if (!SCHEMES.includes(raw.activeScheme)) {
      raw.activeScheme = "standard";
    }
    if (data && (data as Record<string, unknown>).customColors) {
      if (!raw.schemeColors.standard) {
        raw.schemeColors.standard = (data as Record<string, Record<string, string>>).customColors;
      }
    }
    if (data && (data as Record<string, unknown>).customTextColors) {
      if (!raw.schemeTextColors.standard) {
        raw.schemeTextColors.standard = (data as Record<string, Record<string, string>>).customTextColors;
      }
    }
    return raw;
  }

  private loadSettingsSync(): void {
    try {
      const adapter = this.app.vault.adapter as { basePath?: string };
      if (!adapter.basePath) return;
      const pluginId = this.manifest.id;
      const dataPath = join(adapter.basePath, ".obsidian", "plugins", pluginId, "data.json");
      const data = JSON.parse(readFileSync(dataPath, "utf8"));
      this.settings = this.processSettings(data);
    } catch {
      // 读取失败时使用默认设置
    }
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = this.processSettings(data);
  }

  async saveSettings(): Promise<void> {
    try {
      const json = this.serializeSettings();
      const adapter = this.app.vault.adapter as { basePath?: string };
      if (!adapter.basePath) {
        await this.saveData(this.settings);
        return;
      }
      const dataPath = join(adapter.basePath, ".obsidian", "plugins", this.manifest.id, "data.json");
      writeFileSync(dataPath, json, "utf8");
    } catch (err) {
      console.error("Colorful Tags:", t("Save settings failed"), err);
    }
  }

  private serializeSettings(): string {
    const { tagDict, ...rest } = this.settings;
    const tagDictJson = tagDict.length === 0
      ? "[]"
      : "[\n\t\t" + tagDict.map(e => JSON.stringify(e)).join(",\n\t\t") + "\n\t]";
    const restJson = JSON.stringify(rest, null, "\t");
    return "{\n\t\"tagDict\": " + tagDictJson + ",\n\t" + restJson.slice(2);
  }

  createStyleTag(): void {
    this.styleTag = document.createElement("style");
    this.styleTag.id = "colorful-tags-dynamic";
    document.head.appendChild(this.styleTag);
  }

  removeStyleTag(): void {
    if (this.styleTag) {
      this.styleTag.remove();
      this.styleTag = null;
    }
  }

  rebuildStyleTag(): void {
    if (!this.styleTag) return;
    const parts: string[] = [];
    for (const [name, { bg, text }] of this.styleRules) {
      const escaped = escapeCssSelector(name);
      parts.push(
        `.tag[href="#${escaped}"]{background-color:${bg}!important;color:${text}!important}`
      );
    }
    this.styleTag.textContent = parts.join("\n");
  }

  addStyleRule(name: string, bg: string, text: string): void {
    const existing = this.styleRules.get(name);
    if (existing && existing.bg === bg && existing.text === text) return;
    this.styleRules.set(name, { bg, text });
    const escaped = escapeCssSelector(name);
    const rule = `.tag[href="#${escaped}"]{background-color:${bg}!important;color:${text}!important}`;
    if (this.styleTag) {
      this.styleTag.textContent += "\n" + rule;
    }
  }

  refreshAllStyleRules(): void {
    this.styleRules.clear();
    const seen = new Set<string>();
    const tags = document.querySelectorAll(".tag:not(.token)");
    for (const tag of tags) {
      const href = tag.getAttribute("href");
      if (!href) continue;
      const name = href.startsWith("#") ? href.slice(1) : href;
      if (seen.has(name)) continue;
      seen.add(name);
      this.styleRules.set(name, {
        bg: getColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeColors),
        text: getTextColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeTextColors),
      });
    }
    this.rebuildStyleTag();
  }

  registerObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      if (!this.isRelevantMutation(mutations)) return;
      this.applyAllColors();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "href"],
    });
  }

  private isRelevantMutation(mutations: MutationRecord[]): boolean {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const target = mutation.target as HTMLElement;
        if (
          target.classList?.contains("tag") ||
          target.classList?.contains("cm-hashtag-begin") ||
          target.classList?.contains("cm-hashtag-end")
        ) {
          return true;
        }
        continue;
      }

      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;
          if (
            el.classList?.contains("tag") ||
            el.classList?.contains("cm-hashtag-begin") ||
            el.classList?.contains("cm-hashtag-end") ||
            el.querySelector?.(".tag, .cm-hashtag-begin, .cm-hashtag-end")
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  applyAllColors(): void {
    try {
      this.applyReadingViewTags();
      this.applyEditorViewTags();
    } catch (err) {
      console.error("Colorful Tags:", t("Apply colors failed"), err);
    }
  }

  applyReadingViewTags(): void {
    const tags = document.querySelectorAll(".tag:not(.token)");
    for (const tag of tags) {
      const href = tag.getAttribute("href");
      if (!href) continue;
      const name = href.startsWith("#") ? href.slice(1) : href;
      const bg = getColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeColors);
      const text = getTextColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeTextColors);
      this.addStyleRule(name, bg, text);
    }
  }

  applyEditorViewTags(): void {
    const begins = document.querySelectorAll(".cm-hashtag-begin");
    for (const el of begins) {
      const next = el.nextElementSibling;
      if (next && next.classList.contains("cm-hashtag-end")) {
        const name = next.textContent ?? "";
        const bg = getColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeColors);
        const text = getTextColor(name, this.settings.tagDict, this.settings.activeScheme, this.settings.schemeTextColors);
        (el as HTMLElement).style.backgroundColor = bg;
        (next as HTMLElement).style.backgroundColor = bg;
        (el as HTMLElement).style.color = text;
        (next as HTMLElement).style.color = text;
      }
    }
  }

  clearEditorColors(): void {
    document.querySelectorAll(".cm-hashtag-begin, .cm-hashtag-end").forEach((t) => {
      (t as HTMLElement).style.removeProperty("background-color");
      (t as HTMLElement).style.removeProperty("color");
    });
  }

  private onPopupColorChange(tagName: string, colorIndex: number): void {
    this.settings.tagDict = this.settings.tagDict
      .map((e) => {
        if (e.length <= 1 || !e.slice(1).includes(tagName)) return e;
        return [e[0], ...e.slice(1).filter((t) => t !== tagName)] as TagDictEntry;
      })
      .filter((e) => e.length > 1);
    const existing = this.settings.tagDict.find((e) => e[0] === colorIndex);
    if (existing) {
      existing.push(tagName);
    } else {
      this.settings.tagDict.push([colorIndex, tagName] as TagDictEntry);
    }
    this.saveSettings();
    this.refreshAllStyleRules();
    this.applyEditorViewTags();
  }
}
