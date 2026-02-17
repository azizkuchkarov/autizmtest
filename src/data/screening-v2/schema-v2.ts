/**
 * Yangi screening struktura (v2)
 * Bloklar, reverse logic, redFlagTrigger
 */

import type { TestSchema, Block } from "@/lib/screening-v2-types";

// Mavjud domainlarni bloklarga aylantiramiz
const blocks: Block[] = [
  {
    id: "SOCIAL",
    title: "Ijtimoiy aloqa",
    questions: [],
  },
  {
    id: "COMM",
    title: "Muloqot",
    questions: [],
  },
  {
    id: "JOINT",
    title: "Birgalikda diqqat",
    questions: [],
  },
  {
    id: "PLAY",
    title: "O'yin va tasavvur",
    questions: [],
  },
  {
    id: "RRB",
    title: "Takroriy xatti-harakat / rigidlik",
    questions: [],
  },
  {
    id: "SENSORY",
    title: "Sensor va moslashuv",
    questions: [],
  },
];

export const screeningSchemaV2: TestSchema = {
  version: "2.0",
  scale: { min: 0, max: 3 },
  blocks,
  scoring: {},
};
