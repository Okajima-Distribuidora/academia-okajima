CREATE TABLE `academy_video_comment_moderation` (
  `comment_id` INT NOT NULL,
  `video_id` INT NOT NULL,
  `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `hidden_at` DATETIME NULL,
  `hidden_by_user_id` INT NULL,
  `restored_at` DATETIME NULL,
  `restored_by_user_id` INT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  INDEX `academy_comment_moderation_video_hidden_idx` (`video_id`, `is_hidden`),
  CONSTRAINT `academy_comment_moderation_hidden_by_fk`
    FOREIGN KEY (`hidden_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `academy_comment_moderation_restored_by_fk`
    FOREIGN KEY (`restored_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
