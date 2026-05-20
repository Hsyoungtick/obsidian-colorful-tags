import { App, Modal } from "obsidian";
import { isValidCssColor } from "./colorUtils";
import type { SchemeKey } from "./types";
import { SCHEME_LABELS } from "./types";
import { t } from "./i18n";

export class HexInputModal extends Modal {
  private schemeKey: SchemeKey;
  private schemeLabel: string;
  private colorIndex: number;
  private currentBg: string;
  private currentText: string;
  private onSave: (bg: string, text: string) => void;

  constructor(
    app: App,
    schemeKey: SchemeKey,
    colorIndex: number,
    currentBg: string,
    currentText: string,
    onSave: (bg: string, text: string) => void
  ) {
    super(app);
    this.schemeKey = schemeKey;
    this.schemeLabel = t(SCHEME_LABELS[schemeKey] as keyof ReturnType<typeof import("./locale/en").default>);
    this.colorIndex = colorIndex;
    this.currentBg = currentBg;
    this.currentText = currentText;
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `${this.schemeLabel} · ${this.colorIndex}` });

    const preview = contentEl.createDiv();
    Object.assign(preview.style, {
      width: "100%",
      height: "48px",
      borderRadius: "8px",
      background: this.currentBg,
      color: this.currentText,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "1em",
      marginTop: "12px",
    });
    preview.textContent = t("Preview text");

    const makeRow = (label: string, currentVal: string, placeholder: string) => {
      const row = contentEl.createDiv();
      Object.assign(row.style, {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginTop: "12px",
      });
      const lbl = row.createDiv();
      Object.assign(lbl.style, {
        width: "60px",
        fontSize: "0.9em",
        color: "var(--text-muted)",
      });
      lbl.textContent = label;
      const input = row.createEl("input", { type: "text" });
      Object.assign(input.style, { flex: "1", fontSize: "1em" });
      input.value = currentVal;
      input.placeholder = placeholder;
      return { row, input };
    };

    const bgRow = makeRow(t("Background color"), this.currentBg, "#FF4444");
    const textRow = makeRow(t("Text color"), this.currentText, "#FFFFFF");

    const errorEl = contentEl.createDiv();
    Object.assign(errorEl.style, {
      color: "var(--text-error)",
      fontSize: "0.85em",
      minHeight: "1.2em",
      marginTop: "4px",
    });

    const updatePreview = () => {
      const bg = bgRow.input.value.trim() || this.currentBg;
      const tx = textRow.input.value.trim() || this.currentText;
      preview.style.background = bg;
      preview.style.color = tx;
    };
    bgRow.input.addEventListener("input", updatePreview);
    textRow.input.addEventListener("input", updatePreview);

    const validateAndSave = () => {
      const bg = bgRow.input.value.trim();
      const tx = textRow.input.value.trim();

      if (bg && !isValidCssColor(bg)) {
        errorEl.textContent = t("Invalid bg color");
        return;
      }
      if (tx && !isValidCssColor(tx)) {
        errorEl.textContent = t("Invalid text color");
        return;
      }

      errorEl.textContent = "";
      if (bg || tx) {
        this.onSave(bg || this.currentBg, tx || this.currentText);
      }
      this.close();
    };

    const btnRow = contentEl.createDiv();
    Object.assign(btnRow.style, {
      display: "flex",
      gap: "8px",
      justifyContent: "flex-end",
      marginTop: "16px",
    });

    const closeBtn = btnRow.createEl("button", { text: t("Close") });
    closeBtn.addEventListener("click", () => this.close());

    const saveBtn = btnRow.createEl("button", { text: t("Save"), cls: "mod-cta" });
    saveBtn.addEventListener("click", validateAndSave);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        validateAndSave();
      }
      if (e.key === "Escape") {
        this.close();
      }
    };
    bgRow.input.addEventListener("keydown", handleKey);
    textRow.input.addEventListener("keydown", handleKey);

    setTimeout(() => bgRow.input.focus(), 50);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
