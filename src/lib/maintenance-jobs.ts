import { db } from "@/lib/db";

export interface MaintenanceJobOptions {
  now?: Date;
  dryRun?: boolean;
}

export async function runMaintenanceJobs(options: MaintenanceJobOptions = {}) {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const staleAudioThreshold = new Date(now.getTime() - 30 * 60 * 1000);
  const staleTransactionThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const expiredStoriesWhere = { expiresAt: { lt: now } };
  const staleAudioWhere = {
    status: "processing",
    updatedAt: { lt: staleAudioThreshold },
    attempts: { lt: 3 },
  };
  const exhaustedAudioWhere = {
    status: "processing",
    updatedAt: { lt: staleAudioThreshold },
    attempts: { gte: 3 },
  };
  const expiredPasswordResetWhere = { expires: { lt: now } };
  const stalePendingTransactionWhere = {
    status: "pending",
    createdAt: { lt: staleTransactionThreshold },
  };

  const counts = {
    expiredStories: await db.story.count({ where: expiredStoriesWhere }),
    staleAudioJobsToRetry: await db.audioProcessingJob.count({ where: staleAudioWhere }),
    staleAudioJobsToFail: await db.audioProcessingJob.count({ where: exhaustedAudioWhere }),
    expiredPasswordResetTokens: await db.passwordResetToken.count({
      where: expiredPasswordResetWhere,
    }),
    stalePendingTransactions: await db.transaction.count({ where: stalePendingTransactionWhere }),
  };

  if (dryRun) {
    return {
      dryRun,
      now: now.toISOString(),
      counts,
      mutations: {
        expiredStoriesDeleted: 0,
        staleAudioJobsRequeued: 0,
        staleAudioJobsFailed: 0,
        expiredPasswordResetTokensDeleted: 0,
        stalePendingTransactionsFailed: 0,
      },
    };
  }

  const [
    expiredStoriesDeleted,
    staleMusicRequeued,
    staleAudioJobsRequeued,
    staleMusicFailed,
    staleAudioJobsFailed,
    expiredPasswordResetTokensDeleted,
    stalePendingTransactionsFailed,
  ] = await db.$transaction([
    db.story.deleteMany({ where: expiredStoriesWhere }),
    db.music.updateMany({
      where: { processingJobs: { some: staleAudioWhere } },
      data: { processingStatus: "pending", processingError: null },
    }),
    db.audioProcessingJob.updateMany({
      where: staleAudioWhere,
      data: {
        status: "pending",
        error: null,
        startedAt: null,
        completedAt: null,
      },
    }),
    db.music.updateMany({
      where: { processingJobs: { some: exhaustedAudioWhere } },
      data: {
        processingStatus: "failed",
        processingError: "Processing job timed out after maximum retry attempts.",
      },
    }),
    db.audioProcessingJob.updateMany({
      where: exhaustedAudioWhere,
      data: {
        status: "failed",
        error: "Processing job timed out after maximum retry attempts.",
        completedAt: now,
      },
    }),
    db.passwordResetToken.deleteMany({ where: expiredPasswordResetWhere }),
    db.transaction.updateMany({
      where: stalePendingTransactionWhere,
      data: { status: "failed" },
    }),
  ]);

  return {
    dryRun,
    now: now.toISOString(),
    counts,
    mutations: {
      expiredStoriesDeleted: expiredStoriesDeleted.count,
      staleAudioJobsRequeued: staleAudioJobsRequeued.count,
      staleAudioJobsFailed: staleAudioJobsFailed.count,
      staleMusicRequeued: staleMusicRequeued.count,
      staleMusicFailed: staleMusicFailed.count,
      expiredPasswordResetTokensDeleted: expiredPasswordResetTokensDeleted.count,
      stalePendingTransactionsFailed: stalePendingTransactionsFailed.count,
    },
  };
}
