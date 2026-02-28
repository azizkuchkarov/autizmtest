const fs = require("fs");
const p = "src/app/result/[assessmentId]/ResultPageClient.tsx";
let s = fs.readFileSync(p, "utf8");

// Low risk: from "Kuzatishni" to just before {result.totalScore
s = s.replace(
  /Kuzatishni davom ettiring\. Agar keyinchalik[\s\S]*?(?=\n\s*\{result\.totalScore > 40)/,
  "{t(\"result.screening.lowRiskAdvice\")}\n                {result.totalScore > 40"
);

// Moderate: "Bolalar nevrologi yoki rivojlanish bo'yicha..."
s = s.replace(
  /Bolalar nevrologi yoki rivojlanish bo[\u2018\u2019']yicha mutaxassis bilan konsultatsiya qilish tavsiya etiladi\.[^<]+(?=<\/p>)/,
  "{t(\"result.screening.moderateAdvice\")}\n                {result.totalScore > 40 && \" \" + t(\"result.screening.moderateAdvice40\")}"
);

// High: "Tezroq bolalar nevrologi..."
s = s.replace(
  /Tezroq bolalar nevrologi yoki rivojlanish\/autizm[^<]+(?=<\/p>)/,
  "{t(\"result.screening.highRiskAdvice\")}"
);

// Low risk 40% line: replace Uzbek string with t()
s = s.replace(
  /(\{result\.totalScore > 40 && )"[^"]*40% dan yuqori[^"]*"/,
  '$1" " + t("result.screening.lowRiskAdvice40")'
);

const ap = "[\u2018\u2019']"; // Unicode apostrophe

// Past xavf: replace ternary of Uzbek strings with ageGroup + t()
s = s.replace(
  new RegExp(
    "\\{ageLabel === \"1,5–2 yosh\"[\\s\\S]*?paydo bo" + ap + "lsa mutaxassisga murojaat qilish tavsiya etiladi\\.\"\\}"
  ),
  '{ageGroup === "AGE_1_5_2"\n                  ? t("result.screening.lowRiskDesc1_5_2")\n                  : ageGroup === "AGE_3_4" || ageGroup === "AGE_5_6"\n                    ? t("result.screening.lowRiskDesc3_6")\n                    : t("result.screening.lowRiskDesc7_9")}'
);

// O'rtacha xavf: replace template with ageLabel + t()
s = s.replace(
  new RegExp(
    "\\{ageLabel\\s+\\?\\s+`\\$\\{ageLabel\\} guruhidagi bolada skrining[^`]+`\\s+:\\s+\"Skrining[^\"]+baholash orqali aniqroq yo" + ap + "nalish olish mumkin\\.\"\\}"
  ),
  '{ageLabel ? ageLabel + " " + t("result.screening.moderateRiskDesc") : t("result.screening.moderateRiskDescNoAge")}'
);

// Yuqori xavf: replace single paragraph with t()
s = s.replace(
  new RegExp("Skrining bo" + ap + "yicha belgilar sezilarli darajada qayd etildi\\. Bu natija <strong>diagnoz emas</strong>;[^<]+qo" + ap + "yiladi\\."),
  '{t("result.screening.highRiskDesc")}'
);

fs.writeFileSync(p, s);
console.log("Done");
