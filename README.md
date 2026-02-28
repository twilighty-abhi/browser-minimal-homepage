# Minimal Productivity Homepage

A Manifest V3 Chrome/Edge extension that replaces the new tab with a calming, productivity-focused dashboard. Includes search, quick links, a Pomodoro-style timer, daily goals, theming, and a configurable settings panel — no frameworks, just vanilla HTML/CSS/JS.

## About

**Minimal Productivity Homepage** is a lightweight browser extension that transforms every new tab into a clean, distraction-free workspace. Built with pure HTML, CSS, and JavaScript (no external frameworks or dependencies beyond Google Fonts), it keeps you focused with a Pomodoro timer, daily goal tracking, and quick-access links — while staying completely private (all data stays in your browser's localStorage).

## Features

- **Smart Search** — Google search box with autofocus and URL detection.
- **Custom Quick Links** — Default links for Gmail, GitHub, Notion, YouTube, LinkedIn, Calendar. Fully editable from Settings.
- **Focus Timer** — Configurable Pomodoro timer with play/pause/reset, session counter, and desktop notifications.
- **Daily Goals** — Three persistent goals with checkboxes, inline editing, and automatic midnight reset.
- **Dynamic Greeting** — Time-of-day greeting with optional display name.
- **Theme Toggle** — Light/dark themes via CSS custom properties with saved preference.
- **Settings Sidebar** — Slide-in panel for editing name, quick links (add/remove), timer duration, goals, and data reset.
- **Progress Indicators** — Day progress bar under the clock; hover to see day/week/month/year percentages.

## Project Structure

```
browser-homepage/
├── manifest.json       # Chrome extension manifest (V3)
├── index.html          # New tab HTML
├── styles.css          # Theme + layout (pure CSS)
├── script.js           # All behavior (vanilla JS)
├── icon16.png          # Extension icon 16×16
├── icon48.png          # Extension icon 48×48
├── icon128.png         # Extension icon 128×128
└── README.md
```

## Installation

1. Clone or download this repository.
2. Ensure `icon16.png`, `icon48.png`, `icon128.png` exist in the root directory.
3. Open `chrome://extensions/` (or `edge://extensions/`).
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the project folder.
6. Open a new tab.

### Generate placeholder icons (PowerShell)

```powershell
Add-Type -AssemblyName System.Drawing
foreach ($size in @(16, 48, 128)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::FromArgb(94, 106, 210))
    $font = New-Object System.Drawing.Font('Arial', [Math]::Max($size/3, 8), 'Bold')
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString('P', $font, $brush, $size/2, $size/2, $sf)
    $bitmap.Save("$PWD\icon$size.png")
    $graphics.Dispose(); $bitmap.Dispose(); $font.Dispose(); $brush.Dispose()
}
```

## Usage

| Feature | How |
|---|---|
| **Search** | Type a query and press Enter. URLs navigate directly. |
| **Quick Links** | Click a tile to open the site. Edit in Settings. |
| **Focus Timer** | Play/Pause/Reset in the footer bar. Set duration in Settings. |
| **Daily Goals** | Tick checkboxes; click Edit/Save to rename. Also editable in Settings. |
| **Theme** | Click the moon/sun icon in the header. |
| **Settings** | Click the gear icon. Edit name, links, timer, goals, or reset all data. |
| **Progress** | Hover the clock to see day/week/month/year progress bars. |

## Customization

- **Default links** — Edit `DEFAULT_QUICK_LINKS` in `script.js`.
- **Default goals** — Edit `DEFAULT_GOALS` in `script.js`.
- **Timer duration** — Change `DEFAULT_FOCUS_MINUTES` in `script.js`.
- **Colors** — Adjust CSS custom properties in `styles.css` (`:root` for dark, `html:not(.dark)` for light).

## Tech Stack

- HTML5, CSS3 (custom properties, flex/grid), vanilla JavaScript
- Chrome Extension Manifest V3
- localStorage for persistence
- Google Fonts (Inter) + Material Symbols Outlined

## Browser Compatibility

- Chrome, Edge, Brave, Opera (Chromium-based, Manifest V3)
- Not compatible with Firefox or Safari

## License

MIT