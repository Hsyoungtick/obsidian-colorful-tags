import {
  NUM_COLORS,
  DEFAULT_SCHEME_COLORS,
  type SchemeKey,
  type SchemeColors,
  type TagDictEntry,
} from "./types";
import { getColorIndex, getColorValue } from "./colorUtils";

interface PopupDeps {
  getSettings: () => {
    tagDict: TagDictEntry[];
    activeScheme: SchemeKey;
    schemeColors: SchemeColors;
  };
  onColorChange: (tagName: string, colorIndex: number) => void;
}

export class TagPopup {
  private popup: HTMLDivElement | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTagName: string | null = null;
  private currentColorIndex: number | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private circleClickHandlers: Map<HTMLDivElement, () => void> = new Map();
  private deps: PopupDeps;
  private lastRafId = 0;

  constructor(deps: PopupDeps) {
    this.deps = deps;
  }

  create(): void {
    this.popup = document.createElement("div");
    this.popup.className = "colorful-tags-popup";

    for (let i = 1; i <= NUM_COLORS; i++) {
      const circle = document.createElement("div");
      circle.className = "colorful-tags-circle";
      circle.dataset.colorIndex = String(i);
      circle.style.background = DEFAULT_SCHEME_COLORS.standard[i as keyof typeof DEFAULT_SCHEME_COLORS.standard];

      circle.addEventListener("mouseenter", () => {
        circle.style.transform = "scale(1.3)";
        circle.style.border = "2.5px solid white";
      });
      circle.addEventListener("mouseleave", () => {
        circle.style.transform = "scale(1)";
        if (this.currentColorIndex !== i) {
          circle.style.border = "2.5px solid transparent";
        }
      });

      const clickHandler = () => this.onPopupColorClick(i);
      circle.addEventListener("click", clickHandler);
      this.circleClickHandlers.set(circle, clickHandler);

      this.popup.appendChild(circle);
    }

    document.body.appendChild(this.popup);

    this.mouseMoveHandler = (e: MouseEvent) => {
      cancelAnimationFrame(this.lastRafId);
      this.lastRafId = requestAnimationFrame(() => {
        const target = e.target as HTMLElement;
        if (
          target.classList.contains("cm-hashtag-begin") ||
          target.classList.contains("cm-hashtag-end")
        ) {
          this.scheduleShow(target);
        } else if (!this.popup?.contains(target)) {
          this.scheduleHide();
        }
      });
    };

    this.popup.addEventListener("mouseenter", () => {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    });
    this.popup.addEventListener("mouseleave", () => this.scheduleHide());
    document.addEventListener("mousemove", this.mouseMoveHandler);
  }

  destroy(): void {
    if (this.lastRafId) {
      cancelAnimationFrame(this.lastRafId);
    }
    if (this.mouseMoveHandler) {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    if (this.popup) {
      this.popup.querySelectorAll(".colorful-tags-circle").forEach((circle) => {
        const handler = this.circleClickHandlers.get(circle as HTMLDivElement);
        if (handler) {
          circle.removeEventListener("click", handler);
        }
      });
      this.circleClickHandlers.clear();

      this.popup.remove();
      this.popup = null;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  updateColors(): void {
    if (!this.popup) return;
    const { activeScheme, schemeColors } = this.deps.getSettings();
    const circles = this.popup.querySelectorAll(".colorful-tags-circle");
    circles.forEach((c) => {
      const idx = parseInt((c as HTMLElement).dataset.colorIndex ?? "0");
      (c as HTMLElement).style.background = getColorValue(idx, activeScheme, schemeColors);
      if (idx === this.currentColorIndex) {
        (c as HTMLElement).style.border = "2.5px solid white";
        (c as HTMLElement).style.transform = "scale(1.15)";
      } else {
        (c as HTMLElement).style.border = "2.5px solid transparent";
        (c as HTMLElement).style.transform = "scale(1)";
      }
    });
  }

  private scheduleShow(target: HTMLElement): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.show(target);
  }

  private scheduleHide(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), 200);
  }

  private show(target: HTMLElement): void {
    if (!this.popup) return;

    let name = "";
    let anchorEl = target;

    if (target.classList.contains("cm-hashtag-end")) {
      name = target.textContent ?? "";
      const prev = target.previousElementSibling;
      if (prev && prev.classList.contains("cm-hashtag-begin")) {
        anchorEl = prev as HTMLElement;
      }
    } else if (target.classList.contains("cm-hashtag-begin")) {
      const next = target.nextElementSibling;
      if (next && next.classList.contains("cm-hashtag-end")) {
        name = next.textContent ?? "";
      }
      anchorEl = target;
    }

    if (!name) return;

    const { tagDict, activeScheme, schemeColors } = this.deps.getSettings();
    this.currentTagName = name;
    this.currentColorIndex = getColorIndex(name, tagDict);

    this.updateColors();

    const rect = anchorEl.getBoundingClientRect();
    this.popup.style.display = "flex";
    const popupRect = this.popup.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - popupRect.width / 2;
    let top = rect.bottom + 6;

    if (left < 4) left = 4;
    if (left + popupRect.width > window.innerWidth - 4) {
      left = window.innerWidth - popupRect.width - 4;
    }
    if (top + popupRect.height > window.innerHeight - 4) {
      top = rect.top - popupRect.height - 6;
    }

    this.popup.style.left = left + "px";
    this.popup.style.top = top + "px";
  }

  private hide(): void {
    if (this.popup) {
      this.popup.style.display = "none";
    }
    this.currentTagName = null;
    this.currentColorIndex = null;
  }

  private onPopupColorClick(colorIndex: number): void {
    if (!this.currentTagName) return;
    this.deps.onColorChange(this.currentTagName, colorIndex);
    this.hide();
  }
}
