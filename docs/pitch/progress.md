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
| 2026-11-20 | B12 | Vazirlik paneli: 5 KPI (278 murojaat, 171 kelishuv 61,5 %, 9,4 kun, 61,2 mln soʻm qaytarilgan boj, 42 mediator), oylar boʻyicha chiziqli grafik, nizo turlari va 14 hudud kesimida (jadval koʻrinishi ham bor); ranglar dataviz validatoridan oʻtgan | shots/B12-vazirlik-1440.png |
| 2026-11-20 | A5 | Kiritish tekshiruvi (qisqa tavsif, notoʻgʻri tur/hudud → tushunarli oʻzbekcha xabar) va AI soʻrovlariga daqiqasiga 30 ta cheklov | - |
| 2026-11-20 | B14 | Demo maʼlumotlar: 42 mediator, 278 ish (171 kelishuv, 61,5 %), 2 koʻrgazmali ish (MD-2026-0041 kelishuv, MD-2026-0042 sessiya ertaga 10:00); "Demo holatini tiklash" (kalit bilan), /demo sahna yordamchisi: namuna ovoz, javoblarni avtomatik toʻldirish, demo hisoblar | - |
| 2026-11-20 | Jonli test | Butun oqim lokal Django + Gemini bilan boshidan oxirigacha oʻtdi: AI javoblari 1,3–2,5 s, kelishuv tomonlar rolini toʻgʻri yozadi | - |
| 2026-11-20 | B15 | Huquqiy yordamchi (/huquq, hisobsiz): "Mediatsiya toʻgʻrisida"gi Qonunning amaldagi matni (41 modda, 2025-yil OʻRQ-1089 oʻzgartishlari bilan) boʻyicha BM25 qidiruv + AI javob, har javobda moddaga havola. Kelishuv PDF ham 29 va 29¹-moddalarga tayanadi. Topildi: 29¹-modda kelishuvga majburiy kuch beradi, 9¹-modda vazirlikka statistika vakolatini beradi | shots/B15-huquq-1440.png |
| 2026-11-20 | Fon | Fon dizayni (izlanish asosida): rasmiy hujjat va sertifikatlardagi gilyosh (guilloche) chiziqlari — har sahifa tepasida toʻlqin chiziqlar, hero/kirish/muhr lahzalari ortida sekin aylanuvchi rozetka; "Raqamlar" boʻlimida oʻzbek girih (8 qirrali yulduz, dilduz) naqshi. Hammasi koddan SVG, rasm faylsiz | shots/BG-landing-1440.png, shots/BG-raqamlar-1440.png |
| 2026-11-20 | Fon | "Atlas muvozanati": sahifa chetlarida oʻzbek xon-atlas (abr) naqshi Samarqand koshinlari ranglarida (kobalt, firuza, zaʼfaron, anor qizil), tarozi pallalaridek koʻzgu-simmetrik — adolat va ikki tomon tengligi ramzi; telefonda ingichka atlas jiyaklari | shots/FON-e-1440.png, shots/FON-e-kirish-1440.png |
| 2026-11-20 | Fon v2 | Atlas naqshi boyitildi: qavatma-qavat zinali romblar (tashqi rang → krem oraliq → ichki rang → yorqin markaz), atlas "taroq" belgilari, koʻp rangli jiyak, ipak tolalari va yengil ipak yaltirashi; har bir sarlavha ostida ingichka rangli atlas chizigʻi | shots/FON-e-1440.png |
