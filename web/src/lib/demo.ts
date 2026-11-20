// Stage helpers shared by the intake wizard, the respondent page and /demo.

export const SAMPLE_DISPUTES = [
  {
    label: "Ijara qarzi",
    text: "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm boʻldi. Uydan chiqarib yubormoqchi emasman, faqat pulimni olmoqchiman.",
  },
  {
    label: "Qarz",
    text: "Doʻstimga 2025-yil mart oyida 15 million soʻm qarz berdim. Yarim yilda qaytaraman degan edi, hozirgacha qaytarmayapti.",
  },
  {
    label: "Isteʼmolchi",
    text: "Doʻkondan 6 million soʻmga muzlatgich oldim, ikki haftada buzildi. Kafolat boʻlsa ham doʻkon almashtirib bermayapti.",
  },
];

export const SAMPLE_VOICE = "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm boʻldi.";

export const RESPONDENT_QUESTIONS = [
  "Vaziyatni oʻz soʻzingiz bilan qisqacha yozing",
  "Siz nimani xohlaysiz?",
  "Nimani taklif qila olasiz?",
];

export const SAMPLE_RESPONDENT_ANSWERS = [
  "Ishdan boʻshab qoldim, shuning uchun 3 oy toʻlay olmadim. Qarzni tan olaman.",
  "Uyda qolishni va qarzni boʻlib toʻlashni xohlayman.",
  "Har oy 1 500 000 soʻmdan, 6 oy davomida toʻlay olaman.",
];

const DEMO_FLAG = "ma.demo.prefill";

/** /demo sets a one-shot flag; the next screen reads and clears it. */
export function setDemoPrefill(kind: "voice" | "answers") {
  try {
    window.localStorage.setItem(DEMO_FLAG, kind);
  } catch {
    /* ignore */
  }
}

export function takeDemoPrefill(kind: "voice" | "answers"): boolean {
  try {
    if (window.localStorage.getItem(DEMO_FLAG) === kind) {
      window.localStorage.removeItem(DEMO_FLAG);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
