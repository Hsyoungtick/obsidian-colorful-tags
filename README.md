<div align="center">

### Colorful Tags

An Obsidian plugin that makes Tags colorful

English / [中文](README_zh.md)

</div>

## 💻 Features

- **Auto Color Assignment** — Tags are automatically assigned one of 9 colors based on their first character's Unicode code point, ensuring the same tag always gets the same color
- **Quick Color Picker** — Hover over a tag in the editor view to quickly change its color via a popup
- **Custom Tag Colors** — Pin specific tags to specific color indices
- **Custom Color Values** — Click any color block in settings to customize its background and text color
- **Reading & Editor View** — Works in both reading view and live editor view

## 🚀 Install

### Option 1: Install via BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings → **Add Beta plugin**
3. Paste the repository URL: `https://github.com/Hsyoungtick/obsidian-colorful-tags`
4. Enable the plugin

### Option 2: Manual Install

1. Download `main.js`, `styles.css`, `manifest.json` from [Releases](https://github.com/Hsyoungtick/obsidian-colorful-tags/releases)
2. Create a `colorful-tags` folder under `.obsidian/plugins/`
3. Move the downloaded files to `.obsidian/plugins/colorful-tags/`
4. Restart Obsidian and enable the plugin in settings

## 📖 Usage

### Automatic Coloring

Tags are automatically colored as you type. The color is determined by the first character of the tag name using `codePointAt(0) % 9 + 1`, so the same tag name always gets the same color.

### Quick Color Picker (Editor View)

Hover over any tag in the editor view to see a popup with 9 color circles. Click one to pin that tag to a specific color index.

### Tag Dictionary

In the settings panel, you can manage tag-to-color mappings. Enter tag names (without `#`) separated by commas.

## 🏗️ Development

```bash
# Install dependencies
pnpm install

# Development mode (watch file changes)
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test
```

To auto-copy to your Vault during development, create `.devconfig.json`:

```json
{
  "vaultPluginPaths": [
    "/path/to/your/vault/.obsidian/plugins/colorful-tags"
  ]
}
```

## ✨ Inspired By

- [obsidian-colorful-tag](https://github.com/rien7/obsidian-colorful-tag): Make your tags more beautiful and powerful!
- [CSS片段-标签多彩小丸子](https://coffeetea.top/zh/css-snippets/%E6%A0%87%E7%AD%BE%E5%A4%9A%E5%BD%A9%E5%B0%8F%E4%B8%B8%E5%AD%90.html): Implement colorful tags with 7 colors in sequence.

## 🤖 Disclaimer

This project was generated with AI assistance. Use with discretion if this concerns you.

## 📝 License

[MIT](LICENSE)
