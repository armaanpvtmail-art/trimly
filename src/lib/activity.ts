import { prisma } from "@/lib/prisma";
import type { ActorType, Prisma } from "@prisma/client";

export interface ActivityInput {
  actorType: ActorType;
  userId?: string | null;
  adminId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Write an audit/activity log entry. Never throws — logging must not break the
 * primary flow.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorType: input.actorType,
        userId: input.userId ?? null,
        adminId: input.adminId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        description: input.description ?? null,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[activity] failed to log:", (err as Error).message);
    }
  }
}
