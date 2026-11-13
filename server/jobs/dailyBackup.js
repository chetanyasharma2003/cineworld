import cron from "node-cron";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const startBackupJobs = () => {
  // Daily backup at 2 AM UTC
  cron.schedule("0 2 * * *", async () => {
    await performBackup("daily");
  });

  // Weekly backup every Sunday at 3 AM UTC
  cron.schedule("0 3 * * 0", async () => {
    await performBackup("weekly");
  });

  // Monthly backup on 1st of month at 4 AM UTC
  cron.schedule("0 4 1 * *", async () => {
    await performBackup("monthly");
  });

  logger.info("Backup jobs scheduled", {
    daily: "2 AM UTC",
    weekly: "3 AM UTC (Sundays)",
    monthly: "4 AM UTC (1st of month)",
  });
};

async function performBackup(type) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${type}-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    logger.info(`Starting ${type} backup`, { file: backupName });

    // Export all collections
    const collections = mongoose.connection.collections;
    const backup = {};

    for (const [name, collection] of Object.entries(collections)) {
      backup[name] = await collection.find({}).toArray();
    }

    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

    logger.info(`${type} backup completed`, {
      file: backupName,
      size: `${sizeInMB}MB`,
      collections: Object.keys(backup).length,
    });

    // Clean old backups (keep last 30 for daily, 12 for weekly, 24 for monthly)
    await cleanOldBackups(type);
  } catch (err) {
    logger.error(`${type} backup failed`, {
      error: err.message,
      stack: err.stack,
    });

    // Alert via Sentry if available
    if (process.env.SENTRY_DSN) {
      const Sentry = await import("@sentry/node");
      Sentry.captureException(new Error(`Backup failed: ${err.message}`), {
        tags: { type: "backup_failure", backup_type: type },
      });
    }
  }
}

function cleanOldBackups(type) {
  const maxBackups = {
    daily: 30,
    weekly: 12,
    monthly: 24,
  };

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.includes(`backup-${type}`))
    .sort()
    .reverse();

  const filesToDelete = files.slice(maxBackups[type] || 30);

  filesToDelete.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    try {
      fs.unlinkSync(filePath);
      logger.info(`Deleted old backup`, { file });
    } catch (err) {
      logger.warn(`Failed to delete backup`, { file, error: err.message });
    }
  });
}

// Manual restore function
export async function restoreBackup(backupFile) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFile);
    const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));

    logger.warn(`Restoring from backup: ${backupFile}`);

    for (const [collectionName, documents] of Object.entries(backupData)) {
      const collection = mongoose.connection.collection(collectionName);
      await collection.deleteMany({});
      if (documents.length > 0) {
        await collection.insertMany(documents);
      }
    }

    logger.info(`Backup restored successfully`, { file: backupFile });
    return { success: true, message: `Restored from ${backupFile}` };
  } catch (err) {
    logger.error(`Restore failed`, { error: err.message });
    throw err;
  }
}

// List available backups
export function listBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .sort()
    .reverse()
    .map((file) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
        created: stats.birthtime,
      };
    });

  return files;
}
