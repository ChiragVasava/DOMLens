# 16 - Installation & Setup Guide

## Quick Installation Guide

Because **Qursor++** is built as a zero-dependency native Chrome Extension (Manifest V3), no build, bundling, or `npm install` steps are required prior to installation.

---

## Step-by-Step Unpacked Installation

### Prerequisites
- Any modern Chromium-based browser supporting Manifest V3:
  - Google Chrome (v102+)
  - Microsoft Edge (v102+)
  - Brave Browser
  - Opera / Vivaldi

---

### Installation Steps

1. **Clone or Download Repository**:
   Clone the repository to your local system:
   ```bash
   git clone https://github.com/ChiragVasava/DOMLens.git
   ```

2. **Open Extension Management Page**:
   Open your Chromium browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner of the Extensions page.

4. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top toolbar.
   - Select the project root folder (`c:\Users\...\DOMLens`).

5. **Verify Installation**:
   - Confirm **Qursor++** appears in your extension list with version `1.0.0`.
   - Pin the extension icon to your browser toolbar for quick access.

---

## Testing Extension Functionality

1. Open any public website (e.g. `https://news.ycombinator.com` or your local development server `http://localhost:3000`).
2. Click the **Qursor++** toolbar icon to open the popup.
3. Click **Enable Inspector** (or press `Ctrl+Shift+I` / `Cmd+Shift+I`).
4. Hover over any webpage button or header text; confirm blue bounding highlight box appears.
5. Click an element to lock selection and view detailed telemetry inside the floating Shadow DOM panel.
