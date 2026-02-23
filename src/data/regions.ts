/**
 * Viloyatlar va Toshkent shahar tumanlari — ABA markazlar uchun
 */

export const ABA_REGIONS = [
  "Andijon",
  "Buxoro",
  "Farg‘ona",
  "Jizzax",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
  "Toshkent shahar",
  "Toshkent viloyati",
  "Xorazm",
] as const;

/** Toshkent shahar tumanlari (faqat region === "Toshkent shahar" bo‘lganda ishlatiladi) */
export const TOSHKENT_SHAHAR_DISTRICTS = [
  "Bektemir",
  "Chilonzor",
  "Hamza",
  "Mirobod",
  "Mirzo Ulug‘bek",
  "Olmazor",
  "Sergeli",
  "Shayxontohur",
  "Uchtepa",
  "Yakkasaroy",
  "Yangi hayot",
  "Yunusobod",
  "Yashnobod",
] as const;

export const TOSHKENT_SHAHAR_REGION = "Toshkent shahar" as const;

export function isToshkentShahar(region: string): boolean {
  return region === TOSHKENT_SHAHAR_REGION;
}
