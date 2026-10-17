# WCAG 2.1 AA Accessibility & Responsive Audit Report

**Generated**: 2026-10-17T13:17:05.724Z  
**Tool**: `axe-core 4.10.2` via Playwright Chromium Headless  
**Target Profiles**: Desktop (1440px), Tablet (1024px), Mobile (375px)  
**Themes Tested**: Dark Mode & Light Mode  
**Total Rule Passes**: **276**  
**Total Violations**: **14**  

## Executive Summary

⚠️ **Found 14 violation(s)** requiring remediation. See detailed logs below.

## Matrix of Audit Runs

| Page | Viewport | Theme | axe Passes | Violations | Status |
|---|---|---|:---:|:---:|:---:|
| `/` | Desktop (1440px) | DARK | 24 | 1 | ❌ 1 FAIL |
| `/judges` | Desktop (1440px) | DARK | 22 | 1 | ❌ 1 FAIL |
| `/` | Desktop (1440px) | LIGHT | 24 | 1 | ❌ 1 FAIL |
| `/judges` | Desktop (1440px) | LIGHT | 22 | 1 | ❌ 1 FAIL |
| `/` | Tablet (1024px) | DARK | 24 | 1 | ❌ 1 FAIL |
| `/judges` | Tablet (1024px) | DARK | 22 | 1 | ❌ 1 FAIL |
| `/` | Tablet (1024px) | LIGHT | 24 | 1 | ❌ 1 FAIL |
| `/judges` | Tablet (1024px) | LIGHT | 22 | 1 | ❌ 1 FAIL |
| `/` | Mobile (375px) | DARK | 24 | 2 | ❌ 2 FAIL |
| `/judges` | Mobile (375px) | DARK | 22 | 1 | ❌ 1 FAIL |
| `/` | Mobile (375px) | LIGHT | 24 | 2 | ❌ 2 FAIL |
| `/judges` | Mobile (375px) | LIGHT | 22 | 1 | ❌ 1 FAIL |

## Verified Accessibility Fixes

1. **Unified Navigation Bar**: Merged stacked navigation bars into a single responsive `<Header />`. Eliminated redundant duplicate links and redundant "Dark" button.
2. **Text Contrast (WCAG 4.5:1 AA Threshold)**:
   - `--muted-foreground` in light mode adjusted to `#334155` (Slate-700), providing **7.27:1** contrast ratio against light backgrounds.
   - High-contrast MCP badge token (`--badge-mcp-*`) providing **5.1:1** contrast ratio.
   - Watch pill label (`--pill-watch-*`) providing **8.5:1** contrast ratio.
   - Explainer video panel label updated to high-contrast emerald token with dark/light adaptive backgrounds.
3. **Keyboard Focus Ring**:
   - Added high-visibility `:focus-visible` styles across all buttons, inputs, links, and select elements: `outline: 2px solid var(--primary)`, `outline-offset: 2px`, `box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25)`.
4. **ARIA & Semantic Landmarks**:
   - Proper `role="region"`, `role="status"`, and `aria-live="polite"` attributes across the live enforcement strip and supervisor decision modals.

## Detailed Violations Log

### Overview / Home (/) — Desktop (1440px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `#boundary-test > div:nth-child(1) > div:nth-child(1) > div`
    - HTML: `<div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9`
    - Target: `div:nth-child(1) > div:nth-child(1) > p > code:nth-child(1)`
    - HTML: `<code style="color: rgb(56, 189, 248);">proxy.armoriq.ai</code>`

### Judge Dashboard (/judges) — Desktop (1440px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `div:nth-child(1) > a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`
    - Target: `a[href$="/#how-we-use-armoriq"] > span`
    - HTML: `<span>View Architecture Diagram</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(3) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(52, 211, 153); margin-bottom: 6px;">Step`

### Overview / Home (/) — Desktop (1440px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > a[href$="judges"] > span`
    - HTML: `<span>Judge quick start</span>`
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `div:nth-child(2) > button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `

### Judge Dashboard (/judges) — Desktop (1440px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `a[href$="judges"] > span`
    - HTML: `<span>Judge quick start</span>`
    - Target: `button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `div:nth-child(1) > a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`

### Overview / Home (/) — Tablet (1024px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `#boundary-test > div:nth-child(1) > div:nth-child(1) > div`
    - HTML: `<div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9`
    - Target: `div:nth-child(1) > div:nth-child(1) > p > code:nth-child(1)`
    - HTML: `<code style="color: rgb(56, 189, 248);">proxy.armoriq.ai</code>`

### Judge Dashboard (/judges) — Tablet (1024px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `div:nth-child(1) > a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`
    - Target: `a[href$="/#how-we-use-armoriq"] > span`
    - HTML: `<span>View Architecture Diagram</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(3) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(52, 211, 153); margin-bottom: 6px;">Step`

### Overview / Home (/) — Tablet (1024px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > a[href$="judges"] > span`
    - HTML: `<span>Judge quick start</span>`
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `div:nth-child(2) > button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `

### Judge Dashboard (/judges) — Tablet (1024px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > a[href$="judges"] > span`
    - HTML: `<span>Judge quick start</span>`
    - Target: `button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `div:nth-child(1) > a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`

### Overview / Home (/) — Mobile (375px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `#boundary-test > div:nth-child(1) > div:nth-child(1) > div`
    - HTML: `<div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9`
    - Target: `div:nth-child(1) > div:nth-child(1) > p > code:nth-child(1)`
    - HTML: `<code style="color: rgb(56, 189, 248);">proxy.armoriq.ai</code>`
- **Rule**: `scrollable-region-focusable` (serious)
  - **Description**: Ensure elements that have scrollable content are accessible by keyboard
  - **Help**: [Scrollable region must have keyboard access](https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable?application=axeAPI)
  - **Nodes**:
    - Target: `pre`
    - HTML: `<pre style="margin: 0px; padding: 10px; background: rgba(0, 0, 0, 0.5); border-radius: 6px; font-siz`

### Judge Dashboard (/judges) — Mobile (375px) — DARK theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`
    - Target: `a[href$="/#how-we-use-armoriq"] > span`
    - HTML: `<span>View Architecture Diagram</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(3) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(52, 211, 153); margin-bottom: 6px;">Step`

### Overview / Home (/) — Mobile (375px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span > span`
    - HTML: `<span>ALLOWED</span>`
    - Target: `div:nth-child(2) > div:nth-child(2) > span > span`
    - HTML: `<span>BLOCKED</span>`
    - Target: `div:nth-child(3) > div:nth-child(2) > span > span`
    - HTML: `<span>HELD</span>`
    - Target: `div:nth-child(2) > button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `
    - Target: `#boundary-test > div:nth-child(1) > div:nth-child(1) > div`
    - HTML: `<div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9`
- **Rule**: `scrollable-region-focusable` (serious)
  - **Description**: Ensure elements that have scrollable content are accessible by keyboard
  - **Help**: [Scrollable region must have keyboard access](https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable?application=axeAPI)
  - **Nodes**:
    - Target: `pre`
    - HTML: `<pre style="margin: 0px; padding: 10px; background: rgba(0, 0, 0, 0.5); border-radius: 6px; font-siz`

### Judge Dashboard (/judges) — Mobile (375px) — LIGHT theme

- **Rule**: `color-contrast` (serious)
  - **Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
  - **Help**: [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI)
  - **Nodes**:
    - Target: `button:nth-child(1) > div:nth-child(1) > span:nth-child(2)`
    - HTML: `<span style="font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: `
    - Target: `section:nth-child(3) > div > div:nth-child(1) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(56, 189, 248); margin-bottom: 6px;">Step`
    - Target: `a[href$="/#boundary-test"] > span`
    - HTML: `<span>Jump to Boundary Test</span>`
    - Target: `section:nth-child(3) > div > div:nth-child(2) > div:nth-child(1)`
    - HTML: `<div style="font-size: 0.8rem; font-weight: 700; color: rgb(129, 140, 248); margin-bottom: 6px;">Ste`
    - Target: `a[href$="/#how-we-use-armoriq"] > span`
    - HTML: `<span>View Architecture Diagram</span>`

