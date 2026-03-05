-- Add new metadata fields to media
ALTER TABLE "Media" ADD COLUMN "label" TEXT;
ALTER TABLE "Media" ADD COLUMN "sizeBytes" INTEGER;
ALTER TABLE "Media" ADD COLUMN "usage" TEXT;

-- Create new content tables
CREATE TABLE "SiteDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fileId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "source" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Rebuild tables with required new fields while preserving existing rows
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Doctor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "experience" TEXT,
    "bio" TEXT,
    "education" TEXT,
    "schedule" TEXT,
    "photoId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Doctor_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Doctor" (
    "id",
    "name",
    "slug",
    "speciality",
    "experience",
    "bio",
    "education",
    "schedule",
    "photoId",
    "order",
    "enabled",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    'doctor-' || substr("id", 1, 8),
    "speciality",
    "experience",
    NULL,
    NULL,
    NULL,
    "photoId",
    "order",
    "enabled",
    "createdAt",
    "updatedAt"
FROM "Doctor";

DROP TABLE "Doctor";
ALTER TABLE "new_Doctor" RENAME TO "Doctor";
CREATE UNIQUE INDEX "Doctor_slug_key" ON "Doctor"("slug");

CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT NOT NULL,
    "body" TEXT,
    "priceFrom" TEXT,
    "duration" TEXT,
    "icon" TEXT,
    "badge" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "photoId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sectionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Service_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Service" (
    "id",
    "title",
    "slug",
    "summary",
    "description",
    "body",
    "priceFrom",
    "duration",
    "icon",
    "badge",
    "seoTitle",
    "seoDescription",
    "photoId",
    "order",
    "enabled",
    "sectionId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "title",
    'service-' || substr("id", 1, 8),
    NULL,
    "description",
    NULL,
    NULL,
    NULL,
    "icon",
    NULL,
    NULL,
    NULL,
    NULL,
    "order",
    "enabled",
    "sectionId",
    "createdAt",
    "updatedAt"
FROM "Service";

DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "SiteDocument_slug_key" ON "SiteDocument"("slug");
CREATE UNIQUE INDEX "Media_path_key" ON "Media"("path");
CREATE UNIQUE INDEX "Section_type_key" ON "Section"("type");
