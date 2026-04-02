import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logUserEvent(type: string, metadata: Record<string, unknown>): Promise<void> {
  try {
    await prisma.userEvent.create({
      data: { type, metadata: metadata as Prisma.InputJsonValue },
    });
  } catch (e) {
    console.error("[logUserEvent]", type, e);
  }
}
