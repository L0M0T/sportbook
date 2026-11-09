-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Training" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'Общая',
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "trainerId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "capacity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Training_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Training_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Training" ("capacity", "createdAt", "durationMin", "id", "priceCents", "roomId", "startsAt", "status", "title", "trainerId", "type", "updatedAt") SELECT "capacity", "createdAt", "durationMin", "id", "priceCents", "roomId", "startsAt", "status", "title", "trainerId", "type", "updatedAt" FROM "Training";
DROP TABLE "Training";
ALTER TABLE "new_Training" RENAME TO "Training";
CREATE INDEX "Training_startsAt_status_idx" ON "Training"("startsAt", "status");
CREATE INDEX "Training_trainerId_startsAt_idx" ON "Training"("trainerId", "startsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
