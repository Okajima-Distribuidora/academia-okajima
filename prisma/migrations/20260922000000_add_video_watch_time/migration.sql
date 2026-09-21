CREATE TABLE `academy_video_watch_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` INTEGER NOT NULL,
  `video_id` INTEGER NOT NULL,
  `status` VARCHAR(12) NOT NULL DEFAULT 'active',
  `started_at_ms` BIGINT NOT NULL,
  `last_seen_at_ms` BIGINT NOT NULL,
  `expires_at_ms` BIGINT NOT NULL,
  `ended_at_ms` BIGINT NULL,
  `last_sequence` INTEGER NOT NULL DEFAULT 0,
  `watched_ms` INTEGER NOT NULL DEFAULT 0,
  `accepted_buckets` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `watch_sessions_user_active_idx` (`user_id`, `status`, `last_seen_at_ms`),
  INDEX `watch_sessions_video_started_idx` (`video_id`, `started_at_ms`),
  INDEX `watch_sessions_ended_idx` (`status`, `ended_at_ms`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `academy_video_watch_hourly` (
  `user_id` INTEGER NOT NULL,
  `video_id` INTEGER NOT NULL,
  `hour_start_ms` BIGINT NOT NULL,
  `watched_ms` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`, `video_id`, `hour_start_ms`),
  INDEX `watch_hourly_video_hour_idx` (`video_id`, `hour_start_ms`),
  INDEX `watch_hourly_hour_idx` (`hour_start_ms`),
  INDEX `watch_hourly_user_hour_idx` (`user_id`, `hour_start_ms`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `academy_video_watch_daily` (
  `user_id` INTEGER NOT NULL,
  `video_id` INTEGER NOT NULL,
  `day` VARCHAR(10) NOT NULL,
  `watched_ms` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`, `video_id`, `day`),
  INDEX `watch_daily_video_day_idx` (`video_id`, `day`),
  INDEX `watch_daily_day_idx` (`day`),
  INDEX `watch_daily_user_day_idx` (`user_id`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
