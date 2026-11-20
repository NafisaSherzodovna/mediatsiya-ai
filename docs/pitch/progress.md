# Pitch uchun progress jurnali

Har bir vazifa tugagach, bu jadvalga bitta qator qoʻshiladi. Unda demo endi nimani koʻrsata olishi yoziladi.
Taqdimot shu jadval va `shots/` papkasidagi skrinshotlar asosida tayyorlanadi.

| Vaqt | Vazifa | Demo endi nimani koʻrsata oladi | Skrinshot |
|---|---|---|---|
| 2026-11-20 | Reja | Kontrakt, A/B rejalari va dizayn yoʻnalishi tayyor | - |
| 2026-11-20 | B1 | Web skeleti: dizayn tizimi (Muhr va koʻprik), shriftlar oʻ/gʻ bilan tekshirildi, mock API butun oqimni backendsiz ishlatadi | shots/B1-1440.png |
| 2026-11-20 | B5 | Landing: "koʻprik" animatsiyasi (ikki tomon → AI umumiy nuqta → muhr), sud/mediatsiya taqqoslash, manbali raqamlar, QR; kirish sahifasi demo hisoblar bilan | shots/B5-1440.png |
| 2026-11-20 | B6+B7 | Murojaat ustasi: matn/ovoz → AI tasnif (ishonch halqasi) → sud va mediatsiya taqqoslash (tejash: ~166 kun, ~850 ming soʻm) → ikkinchi tomon → AI taklif xati → yuborildi (QR, Telegram, havola) | shots/B6-4-taqqoslash-1440.png, shots/B7-2-taklif-1440.png |
| 2026-11-20 | A1 | Backend skeleti ishga tushdi: Django + DRF, `/api/health` javob beradi, admin stillari Netlify proksi orqali ishlaydi | - |
| 2026-11-20 | B8 | Ikkinchi tomon sahifasi (telefon, hisobsiz): xat koʻrinishidagi taklif → "Mediatsiya nima?" → 3 savol → AI pozitsiya → "koʻprik" animatsiyasi; notoʻgʻri havola uchun 404 | shots/B8-1-xat-390.png, shots/B8-3-rozi-390.png |
| 2026-11-20 | A2 | Operator paneli (Django admin): ishlar va mediatorlar, filtr va qidiruv; 4 demo hisob (ariza, mediator, vazirlik, admin) | - |
| 2026-11-20 | A3 | REST API kontrakt boʻyicha tayyor: kirish, ishlar (rol boʻyicha koʻrinish), taklif havolasi hisobsiz, mediator bron, vazirlik statistikasi bazadan hisoblanadi | - |
| 2026-11-20 | B2–B4, B9 | AI backend (Python/Django): Gemini, 2 kalit va 2 model bilan failover, zaxira qoidalar; tasnif, taqqoslash (lex.uz manbali narxlar), taklif xati, pozitsiya, mediator maʼlumotnomasi, kelishuv loyihasi va ovozni matnga aylantirish real kalitlar bilan tekshirildi (5–9 s) | - |
| 2026-11-20 | B10 | Murojaatchi kabineti: ishlar roʻyxati, ish sahifasi (jonli yangilanadi): holat paneli, jarayon timeline, tomonlar pozitsiyasi; reyestrdagi mediatorlar katalogi (reyting, tajriba, narx) va sessiya vaqtini bron qilish | shots/B10-4-sessiya-1440.png, shots/B10-3-mediator-1440.png |
| 2026-11-20 | B11 | Mediator kabineti: navbatdagi sessiyalar; AI maʼlumotnoma (faktlar, umumiy nuqtalar, ZOPA markerda, xavflar); shartlardan AI kelishuv loyihasi (tahrirlanadi) → "Yakunlash va muhrlash" muhr animatsiyasi → A4 kelishuv (imzo joylari, QR, qonunga havola) → PDF | shots/B11-2-malumotnoma-1440.png, shots/B11-5-kelishuv-1440.png, shots/B11-kelishuv.pdf |
