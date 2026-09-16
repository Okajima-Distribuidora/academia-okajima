ALTER TABLE `videos`
  ADD COLUMN `upload_status` VARCHAR(20) NOT NULL DEFAULT 'ready',
  ADD COLUMN `upload_started_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  ADD COLUMN `upload_status_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  ADD COLUMN `processing_started_at` DATETIME(0) NULL,
  ADD COLUMN `ready_at` DATETIME(0) NULL,
  ADD COLUMN `cancelled_at` DATETIME(0) NULL,
  ADD COLUMN `deleted_at` DATETIME(0) NULL,
  ADD CONSTRAINT `videos_upload_status_check`
    CHECK (`upload_status` IN ('uploading', 'processing', 'ready', 'cancelled', 'deleted')),
  ADD INDEX `videos_upload_status_updated_idx` (`upload_status`, `upload_status_updated_at`);

-- Existing catalog entries predate upload lifecycle tracking and are already usable.
UPDATE `videos`
SET `ready_at` = `upload_status_updated_at`
WHERE `upload_status` = 'ready';

ALTER TABLE `videos`
  ALTER COLUMN `upload_status` SET DEFAULT 'uploading';
