import {
  NUM_COLORS,
  DEFAULT_SCHEME_COLORS,
  DEFAULT_SCHEME_TEXT,
  type TagDictEntry,
  type SchemeKey,
  type SchemeColors,
} from "./types";

export function getColorIndex(tagName: string, dict: TagDictEntry[]): number {
  if (dict && Array.isArray(dict)) {
    for (const entry of dict) {
      if (entry.length > 1 && entry.slice(1).includes(tagName)) {
        return entry[0];
      }
    }
  }
  const cp = tagName.codePointAt(0) ?? 0;
  return (cp % NUM_COLORS) + 1;
}

export function getColorValue(
  colorIndex: number,
  scheme: SchemeKey,
  schemeColors: SchemeColors
): string {
  return (
    schemeColors?.[scheme]?.[colorIndex] ??
    DEFAULT_SCHEME_COLORS[scheme]?.[colorIndex] ??
    "#808080"
  );
}

export function getTextColorValue(
  colorIndex: number,
  scheme: SchemeKey,
  schemeTextColors: SchemeColors
): string {
  return (
    schemeTextColors?.[scheme]?.[colorIndex] ??
    DEFAULT_SCHEME_TEXT[scheme]?.[colorIndex] ??
    "#FFFFFF"
  );
}

export function getColor(
  tagName: string,
  dict: TagDictEntry[],
  scheme: SchemeKey,
  schemeColors: SchemeColors
): string {
  return getColorValue(getColorIndex(tagName, dict), scheme, schemeColors);
}

export function getTextColor(
  tagName: string,
  dict: TagDictEntry[],
  scheme: SchemeKey,
  schemeTextColors: SchemeColors
): string {
  return getTextColorValue(getColorIndex(tagName, dict), scheme, schemeTextColors);
}

export function escapeCssSelector(str: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(str);
  }
  return str.replace(
    /([\\'"()[\]{}.,:;~!@#$%^&*+=?/<>|\s=])/g,
    "\\$1"
  );
}

const COLOR_NAME_MAP: Record<string, number> = {
  red: 1, orange: 2, yellow: 3, green: 4,
  cyan: 5, blue: 6, purple: 7, magenta: 8, pink: 8, gray: 9,
};

export function migrateDict(raw: unknown): TagDictEntry[] {
  if (Array.isArray(raw)) {
    return raw.map((entry: unknown[]) => {
      if (!Array.isArray(entry) || entry.length === 0) return entry as TagDictEntry;
      const first = entry[0];
      if (typeof first === "string") {
        const idx = COLOR_NAME_MAP[first] ?? 1;
        return [idx, ...entry.slice(1)] as TagDictEntry;
      }
      return entry as TagDictEntry;
    });
  }
  if (raw && typeof raw === "object") {
    const result: TagDictEntry[] = [];
    for (const [tag, idx] of Object.entries(raw as Record<string, number>)) {
      const colorIdx = ((idx - 1) % NUM_COLORS) + 1;
      const existing = result.find((e) => e[0] === colorIdx);
      if (existing) {
        existing.push(tag);
      } else {
        result.push([colorIdx, tag]);
      }
    }
    return result;
  }
  return [];
}

const CSS_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const CSS_NAMED_COLORS: Set<string> = new Set([
  "red", "orange", "yellow", "green", "cyan", "blue", "purple", "magenta",
  "pink", "gray", "grey", "white", "black", "brown", "gold", "silver",
  "navy", "teal", "maroon", "olive", "lime", "aqua", "fuchsia", "indigo",
  "coral", "salmon", "tomato", "khaki", "violet", "crimson", "chocolate",
  "tan", "wheat", "ivory", "lavender", "beige", "azure", "linen",
  "darkred", "darkgreen", "darkblue", "darkcyan", "darkmagenta",
  "lightgray", "lightgreen", "lightblue", "lightcyan", "lightpink",
  "transparent",
]);

export function isValidCssColor(value: string): boolean {
  const trimmed = value.trim();
  if (CSS_COLOR_REGEX.test(trimmed)) return true;
  if (CSS_NAMED_COLORS.has(trimmed.toLowerCase())) return true;
  return false;
}
