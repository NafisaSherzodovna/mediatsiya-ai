# Mediatsiya platformasi — talablar

2026-11-20

## Maqsad

Platforma odamlarga nizoni sudga bormasdan, mediatsiya orqali hal qilishga yordam beradi. AI odamni birinchi murojaatdan imzolangan kelishuvgacha olib boradi, mediatsiyani esa inson-mediator o'tkazadi.

Muvaffaqiyat o'lchovlari:

- Murojaatchilarning necha foizi mediatsiyaga rozi bo'ladi.
- Ikkinchi tomonning necha foizi taklifni qabul qiladi.
- Ishlarning necha foizi kelishuv bilan tugaydi.
- Nizo o'rtacha necha kunda hal bo'ladi.

Uzoq muddatli maqsad: Oʻzbekistonda suddan tashqari hal qilinadigan nizolar ulushini 8 foizdan oshirish.

## Foydalanuvchilar va rollar

| Rol | Kim | Platformada nima qiladi |
| --- | --- | --- |
| Murojaatchi | Nizosi bor fuqaro | Nizoni kiritadi, taklif yuboradi, kelishuvni tasdiqlaydi |
| Ikkinchi tomon | Nizoning boshqa tomoni | Taklifga javob beradi, o'z pozitsiyasini yozadi |
| Mediator | Adliya vazirligi reyestridagi mustaqil mediator | Ishni oladi, sessiya o'tkazadi, kelishuvni yakunlaydi |
| Kompaniya (B2B) | Bank, MFT, ijara kompaniyasi | Ko'plab ishlarni bir vaqtda yuboradi |
| Admin | Platforma jamoasi | Mediator arizalarini tekshirib tasdiqlaydi va platformani boshqaradi |

## Funksional talablar

"MVP" ustunida "Ha" deb belgilangan talablar xakaton demosida bo'lishi shart. "Keyin" deb belgilanganlari xakatondan keyin qilinadi.

| ID | Talab | MVP |
| --- | --- | --- |
| FT-1 | Telefon raqami va SMS kod orqali ro'yxatdan o'tish | Qisman: murojaatchi va mediator login/parol bilan ro'yxatdan o'tadi, mediator admin tasdig'idan keyin ko'rinadi; SMS kod keyin |
| FT-2 | Nizoni matn yoki ovoz bilan kiritish | Tayyor |
| FT-3 | Nizo kartochkasi: tomonlar, summa, sana, hujjat va rasm yuklash | Ha |
| FT-4 | Sud va mediatsiyani vaqt hamda xarajat bo'yicha taqqoslash ekrani | Tayyor |
| FT-5 | Ikkinchi tomonga SMS yoki Telegram orqali havola bilan taklif yuborish; u ro'yxatdan o'tmasdan ham javob bera oladi | Tayyor |
| FT-6 | Mediatorlar katalogi reyestr ustunlari bo'yicha (reyestr sanasi, joylashgan yeri, ixtisoslashgan mediatsiya sohasi — Qonunning 3-moddasidagi sohalar, tillar, o'quv kursi hujjati); eng mos 3 mediator tavsiya qilinadi | Tayyor (demo ma'lumot) |
| FT-7 | Mediatorni taraflar birgalikda tanlaydi (Qonun, 8, 11, 22-moddalar): murojaatchi taklif qiladi, ikkinchi tomon tasdiqlaydi yoki rad etadi; har bir tomon kelishuvgacha mediatordan voz kecha oladi (pul qaytadi, yozishmalar o'chiriladi) | Tayyor |
| FT-8 | Ishning holati: Yangi, Taklif yuborildi, Rozi, Sessiya, Kelishuv, Yopildi | Tayyor |
| FT-9 | Kelishuv loyihasini tahrirlash va PDF qilib yuklab olish | Tayyor |
| FT-10 | Ochiq statistika bosh sahifada: nizo turlari, hududlar, kelishuv foizi (alohida vazirlik roli olib tashlandi) | Tayyor (demo ma'lumot) |
| FT-11 | Platformaning o'zida onlayn video sessiya | Keyin |
| FT-12 | Ikkala tomonning elektron imzosi bilan tasdiqlash | Keyin |
| FT-13 | Click yoki Payme orqali to'lov va komissiyani avtomatik ushlab qolish | Demo: pul platforma hisobiga tushadi, tomonlar 50/50 to'laydi (28-modda), kelishuvdan keyin 10 % komissiya ushlab qolinib, 90 % mediatorga o'tkaziladi; mediator kabinetida daromad ko'rinadi. Haqiqiy shlyuz keyin |
| FT-14 | Kompaniyalar uchun ishlarni Excel orqali ommaviy yuklash | Keyin |
| FT-15 | Kelishuvga erishilmasa, sud yoki hakamlik sudiga yo'naltirish | Keyin |
| FT-16 | Mediator va har bir tomon o'rtasida alohida, maxfiy chat (messenger ko'rinishida); ikkinchi tomon hisobsiz, taklif havolasi orqali kiradi | Tayyor |
| FT-17 | Ish yakunlangach murojaatchi mediatorni 0–5 yulduz bilan baholaydi; reyting baholar o'rtachasi va hal qilingan ishlar soni bilan ko'rsatiladi | Tayyor |
| FT-18 | «Mediatsiya toʻgʻrisida»gi Qonunga muvofiqlik: yozma tartib-taomil kelishuvi ikkinchi tomon mediatorni tasdiqlaganda tuziladi (19, 20-m.); 30 kunlik muddat va taraflar roziligi bilan bir marta +30 kun, muddat oʻtsa tugatiladi (23, 24-m.); har bir taraf istalgan bosqichda voz kechadi, mediator kelishuv imkoni yoʻqligini aytib tugatadi (7, 11, 24-m.); mediator ishni rad etsa pul toʻliq qaytadi (9, 13, 28-m.); mediativ kelishuvda taraflarning toʻliq F.I.Sh. va manzili (29-m.). Bepul mediatsiya va vakil orqali imzolash keyin; elektron rozilik yozma shaklga tenglashishi e-imzo (FT-12) bilan taʼminlanadi | Tayyor (demo) |
| FT-17 | Mediator har bir tomon bilan alohida uchrashuv belgilaydi; ikki tomon bilan uchrashuvlar bir vaqtga to'g'ri kelmaydi; uchrashuv tomon qabul qilgandagina belgilanadi | Tayyor |
| FT-18 | Kelishuv loyihasi ikkala tomonga tasdiqlash uchun yuboriladi; ikkalasi tasdiqlamaguncha mediator muhrlay olmaydi; matn o'zgarsa, tasdiq qayta so'raladi | Tayyor |

## AI talablari

AI mediatsiyaga yetib borish yo'lidagi to'siqlarni olib tashlaydi: odam bilmaydi, ikkinchi tomon rozi bo'lmaydi, hujjat tuzish qiyin.

| ID | AI nima qiladi | Natija | MVP |
| --- | --- | --- | --- |
| AI-1 | Nizoni tasniflaydi: turi (qarz, ijara, oilaviy, iste'molchi, mehnat) va mediatsiyaga yaroqliligi | Nizo turi va qisqa izoh; jinoyat ishi bo'lsa "yaroqsiz" | Tayyor |
| AI-2 | O'zbekcha (lotin va kirill) hamda ruscha matnni tushunadi, ovozni matnga aylantiradi | Matnli nizo tavsifi | Tayyor |
| AI-3 | Sud va mediatsiyani taxminiy vaqt va xarajat bo'yicha taqqoslaydi | Taqqoslash jadvali va manbasi | Tayyor |
| AI-4 | Ikkinchi tomonga betaraf, hujumsiz taklif yozadi va unga ham foydasini tushuntiradi | Murojaatchi tahrirlay oladigan xabar matni | Tayyor |
| AI-5 | Har bir tomonning pozitsiyasini alohida savollar bilan aniqlaydi | Ikkala tomonning talablari va umumiy nuqtalari | Tayyor |
| AI-6 | Mediator uchun ma'lumotnoma tayyorlaydi | 1 sahifa: faktlar, talablar, kelishuv mumkin bo'lgan oraliq | Tayyor |
| AI-7 | Qonun talablariga mos kelishuv loyihasini tuzadi | Tahrirlanadigan kelishuv matni | Tayyor |
| AI-8 | Javoblarni lex.uz'dagi qonun matnlariga (RAG) asoslaydi | Har bir huquqiy fikr yonida modda havolasi | Tayyor |

Cheklovlar:

- AI huquqiy qaror chiqarmaydi va mediatorning o'rnini bosmaydi. Yakuniy so'z tomonlar va mediatorda.
- Ishonchi past bo'lsa, "aniq bilmayman" deydi va ishni insonga yo'naltiradi.
- Foydalanuvchiga u AI bilan gaplashayotgani doim aytiladi.

## Nofunksional talablar

- **Til:** interfeys o'zbekcha (lotin) va ruscha bo'ladi, kirill yozuvidagi matnni ham tushunadi.
- **Qurilma:** platforma mobil telefonda qulay ishlaydi (mobil veb yoki Telegram mini app).
- **Ma'lumot joylashuvi:** Oʻzbekiston fuqarolarining shaxsiy ma'lumotlari Oʻzbekistondagi serverda saqlanadi, bu shaxsiy ma'lumotlar haqidagi qonun talabi.
- **Maxfiylik:** ish tafsilotlarini faqat ikki tomon va mediator ko'radi. Ommaga faqat shaxsiy ma'lumotsiz umumiy statistika ko'rsatiladi.
- **Xavfsizlik:** HTTPS, yuklangan hujjatlar shifrlanadi, har bir harakat jurnalga yoziladi.
- **Tezlik:** demoda AI javobi 10 soniyadan oshmasligi kerak.

## Xakaton MVP doirasi

Demoga FT-1…FT-10 va AI-1…AI-8 kiradi. Mediatorlar 5–10 ta soxta profildan iborat bo'ladi va "demo ma'lumot" deb belgilanadi.

MVPga kirmaydi:

- video sessiya, elektron imzo va to'lov (FT-11…FT-13);
- kompaniyalar uchun ommaviy yuklash (FT-14);
- Adliya vazirligi reyestri bilan haqiqiy integratsiya;
- hakamlik sudiga yo'naltirish (FT-15).

Ochiq savollar:

- [ ] Platforma mobil veb bo'ladimi yoki Telegram mini app?
- [ ] Qaysi AI model va qaysi STT xizmati ishlatiladi?
- [ ] Reyestrda nechta mediator bor? Bu raqam pitch uchun kerak.
- [ ] Pitchdan oldin qaysi 1–2 ta mediator bilan gaplashamiz?

## Demo ssenariysi (3 daqiqa)

1. Uy egasi ovoz bilan aytadi: "Ijarachim 3 oydan beri to'lamayapti." (FT-2, AI-2)
2. AI nizoni "ijara qarzi" deb tasniflaydi va mediatsiyaga yaroqli deydi. (AI-1)
3. Ekranda sud va mediatsiya taqqoslanadi: vaqt va xarajat. (FT-4, AI-3)
4. AI ijarachiga betaraf taklif yozadi, u Telegram orqali yuboriladi. (FT-5, AI-4)
5. Ijarachi havolani ochadi, rozi bo'ladi va o'z holatini yozadi: "ishsiz qoldim, bo'lib to'layman". (AI-5)
6. AI mediatorga ma'lumotnoma tayyorlaydi va kelishuv oralig'ini ko'rsatadi: qarz 6 oyda bo'lib to'lanadi. (AI-6)
7. Mediator tanlanadi va sessiya bron qilinadi. (FT-6, FT-7)
8. Kelishuv loyihasi PDF ko'rinishida chiqadi. (FT-9, AI-7)
9. Murojaatchi mediatorni baholaydi, yangi hal qilingan ish bosh sahifadagi ochiq statistikaga qo'shiladi. (FT-10, FT-17)
