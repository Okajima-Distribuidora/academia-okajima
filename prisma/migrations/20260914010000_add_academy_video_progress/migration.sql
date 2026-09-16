CREATE TABLE `academy_video_progress` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `video_id` INTEGER NOT NULL,
  `resume_position_seconds` INTEGER NOT NULL DEFAULT 0,
  `furthest_position_seconds` INTEGER NOT NULL DEFAULT 0,
  `completed_at` DATETIME(0) NULL,
  `last_watched_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `academy_video_progress_user_video_unique`(`user_id`, `video_id`),
  INDEX `academy_video_progress_user_last_watched_idx`(`user_id`, `last_watched_at`),
  INDEX `academy_video_progress_video_idx`(`video_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
