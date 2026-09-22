CREATE TABLE `academy_video_comment_reactions` (
  `user_id` INT NOT NULL,
  `comment_id` INT NOT NULL,
  `reaction` VARCHAR(8) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `comment_id`),
  INDEX `academy_comment_reactions_comment_reaction_idx` (`comment_id`, `reaction`),
  CONSTRAINT `academy_comment_reactions_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `academy_video_comment_replies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `legacy_reply_id` INT NULL,
  `comment_id` INT NOT NULL,
  `parent_reply_id` INT NULL,
  `user_id` INT NOT NULL,
  `video_id` INT NOT NULL,
  `text` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `academy_comment_replies_legacy_reply_unique` (`legacy_reply_id`),
  INDEX `academy_comment_replies_comment_created_idx` (`comment_id`, `created_at`, `id`),
  INDEX `academy_comment_replies_parent_idx` (`parent_reply_id`),
  INDEX `academy_comment_replies_video_idx` (`video_id`),
  CONSTRAINT `academy_comment_replies_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `academy_video_comment_reply_reactions` (
  `user_id` INT NOT NULL,
  `reply_id` INT NOT NULL,
  `reaction` VARCHAR(8) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `reply_id`),
  INDEX `academy_comment_reply_reactions_reply_reaction_idx` (`reply_id`, `reaction`),
  CONSTRAINT `academy_comment_reply_reactions_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `academy_video_comment_pins` (
  `video_id` INT NOT NULL,
  `comment_id` INT NOT NULL,
  `pinned_by_user_id` INT NULL,
  `pinned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`video_id`),
  UNIQUE INDEX `academy_comment_pins_comment_unique` (`comment_id`),
  INDEX `academy_comment_pins_comment_idx` (`comment_id`),
  CONSTRAINT `academy_comment_pins_user_fk`
    FOREIGN KEY (`pinned_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `academy_video_comment_post_rate_limits` (
  `user_id` INT NOT NULL,
  `window_started_at` DATETIME NOT NULL,
  `post_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `academy_comment_post_rate_limits_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `academy_video_comment_pins` (`video_id`, `comment_id`, `pinned_by_user_id`, `pinned_at`, `updated_at`)
SELECT `comment`.`video_id`, `comment`.`id`, NULL,
  FROM_UNIXTIME(CASE WHEN `comment`.`time` > 0 THEN `comment`.`time` ELSE 0 END),
  FROM_UNIXTIME(CASE WHEN `comment`.`time` > 0 THEN `comment`.`time` ELSE 0 END)
FROM `comments` AS `comment`
LEFT JOIN `comments` AS `earlier`
  ON `earlier`.`video_id` = `comment`.`video_id`
  AND COALESCE(`earlier`.`pinned`, 0) = 1
  AND (`earlier`.`time` < `comment`.`time`
    OR (`earlier`.`time` = `comment`.`time` AND `earlier`.`id` < `comment`.`id`))
WHERE `comment`.`video_id` IS NOT NULL
  AND `comment`.`video_id` > 0
  AND COALESCE(`comment`.`pinned`, 0) = 1
  AND `earlier`.`id` IS NULL;

INSERT INTO `academy_video_comment_replies` (
  `legacy_reply_id`, `comment_id`, `parent_reply_id`, `user_id`, `video_id`, `text`, `created_at`
)
SELECT
  `reply`.`id`, `reply`.`comment_id`, NULL, `reply`.`user_id`, `comment`.`video_id`, `reply`.`text`,
  FROM_UNIXTIME(CASE
    WHEN `reply`.`time` REGEXP '^[0-9]+$' AND CAST(`reply`.`time` AS UNSIGNED) > 0
      THEN CAST(`reply`.`time` AS UNSIGNED)
    ELSE 0
  END)
FROM `comm_replies` AS `reply`
INNER JOIN `comments` AS `comment`
  ON `comment`.`id` = `reply`.`comment_id`
  AND `comment`.`video_id` = `reply`.`video_id`
INNER JOIN `users` AS `user` ON `user`.`id` = `reply`.`user_id`
WHERE `reply`.`text` IS NOT NULL AND TRIM(`reply`.`text`) <> '';
