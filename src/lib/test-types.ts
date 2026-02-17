/**
 * Test turi: 1) Autizmni aniqlash (screening), 2) Autizm progressini aniqlash (progress)
 */
export type TestType = "screening" | "progress";

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  screening: "Autizmni aniqlash",
  progress: "Autizm progressini aniqlash",
};
