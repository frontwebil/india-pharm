export const categories = [
  {
    title: "Чоловіче здоров'я",
    items: [
      ["Віагра", "viagra"],
      ["Сіаліс", "cialis"],
      ["Дапоксетін", "dapoxetine"],
      ["Левітра", "levitra"],
      ["Камагра", "kamagra"],
      ["Вімакс", "vimax"],
      ["Аванафіл", "avanafil"],
      ["Продовження сексу", "prolongatory"],
    ],
  },
  {
    title: "Жіноче здоров'я",
    items: [["Жіночі збуджувачі", "female-stimulants"]],
  },
  {
    title: "Інше",
    items: [
      ["БАДи", "bady"],
      ["Від паління", "smoking-cessation"],
    ],
  },
] as const;

export const categoryNames: Record<string, string> = {
  viagra: "Віагра",
  cialis: "Сіаліс",
  dapoxetine: "Дапоксетін",
  levitra: "Левітра",
  kamagra: "Камагра",
  vimax: "Вімакс",
  avanafil: "Аванафіл",
  prolongatory: "Продовження сексу",

  "female-stimulants": "Жіночі збуджувачі",

  bady: "БАДи",
  "smoking-cessation": "Від паління",
};
