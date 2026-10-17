# Europe Gayrimenkul

Corporate site for **Europe Gayrimenkul Satış ve Kiralama Ticaret Ltd. Şti.** (Istanbul trade registry 440497-5). Turkish, English and Persian. The digital product [FX Guard](https://fxguard.io/) has its own page and links out to the product site.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` writes a static `dist/` folder. Upload that folder to the cPanel `public_html` for the domain. Point the domain at the server only after the A record and SSL are in place.

## Design

- Mark: roof line over a door, ink `#101820`, brass `#C6A15A`, paper `#F3EEE6`, sea `#1B4740` for FX Guard.
- Type: Fraunces and Outfit for Latin, Vazirmatn for Persian.
- Copy lives in `src/i18n.js`. Turkish is the fallback.

## What stays off the public site

Passport numbers, personal tax numbers, bank statements, IBANs and tax-return figures are not published.
