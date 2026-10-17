# Development Notes

## Regenerating the Guide PDF
The architectural guide PDF (`docs/USER_GUIDE.pdf`) is managed dynamically via `siteConfig.js`. To rebuild the PDF and update the frontend assets:
```bash
npm run docs:pdf
```
Ensure you update `siteConfig.guidePdf.pages` if the generated page count changes.
