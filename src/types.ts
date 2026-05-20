export const NUM_COLORS = 9;

export type ColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type SchemeKey = "standard" | "pastel" | "hsl";

export type ColorMap = Record<string, string>;

export interface SchemeColors {
  [scheme: string]: ColorMap;
}

export type TagDictEntry = [number, ...string[]];

export interface PluginSettings {
  tagDict: TagDictEntry[];
  activeScheme: SchemeKey;
  schemeColors: SchemeColors;
  schemeTextColors: SchemeColors;
}

export const DEFAULT_SCHEME_COLORS: SchemeColors = {
  standard: {
    1: "#FF0000", 2: "#FF7F00", 3: "#FFD700", 4: "#00CC00",
    5: "#00CED1", 6: "#0044FF", 7: "#8B00FF", 8: "#FF69B4", 9: "#808080",
  },
  pastel: {
    1: "#FF6B6B", 2: "#FFA06B", 3: "#FFD93D", 4: "#6BCB77",
    5: "#6BCFCF", 6: "#6B9FFF", 7: "#B06BFF", 8: "#FF6BB5", 9: "#A0A0A0",
  },
  hsl: {
    1: "hsl(0, 80%, 40%)", 2: "hsl(30, 80%, 40%)", 3: "hsl(55, 80%, 40%)",
    4: "hsl(120, 70%, 40%)", 5: "hsl(180, 70%, 40%)", 6: "hsl(220, 75%, 40%)",
    7: "hsl(280, 70%, 40%)", 8: "hsl(330, 75%, 40%)", 9: "hsl(0, 0%, 40%)",
  },
};

export const DEFAULT_SCHEME_TEXT: SchemeColors = {
  standard: {
    1: "#FFFFFF", 2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF",
    5: "#FFFFFF", 6: "#FFFFFF", 7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF",
  },
  pastel: {
    1: "#FFFFFF", 2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF",
    5: "#FFFFFF", 6: "#FFFFFF", 7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF",
  },
  hsl: {
    1: "#FFFFFF", 2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF",
    5: "#FFFFFF", 6: "#FFFFFF", 7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF",
  },
};

export const SCHEMES: SchemeKey[] = ["standard", "pastel", "hsl"];

export const SCHEME_LABELS: Record<SchemeKey, string> = {
  standard: "Spectrum rainbow",
  pastel: "Pastel rainbow",
  hsl: "HSL constant lightness",
};

export const DEFAULT_SETTINGS: PluginSettings = {
  tagDict: [],
  activeScheme: "standard",
  schemeColors: {},
  schemeTextColors: {},
};
