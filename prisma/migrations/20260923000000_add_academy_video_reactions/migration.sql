CREATE TABLE `academy_video_reactions` (
  `user_id` INTEGER NOT NULL,
  `video_id` INTEGER NOT NULL,
  `reaction` VARCHAR(8) NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`user_id`, `video_id`),
  INDEX `academy_video_reactions_video_reaction_idx` (`video_id`, `reaction`),
  CONSTRAINT `academy_video_reactions_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve the legacy likes as each user's initial current reaction. The legacy
-- rows remain untouched because they are historical data used outside Academia.
INSERT INTO `academy_video_reactions` (`user_id`, `video_id`, `reaction`)
SELECT legacy.`user_id`, legacy.`video_id`, 'like'
FROM `likes_dislikes` AS legacy
INNER JOIN `users` AS user ON user.`id` = legacy.`user_id`
INNER JOIN `videos` AS video ON video.`id` = legacy.`video_id`
WHERE legacy.`video_id` > 0 AND legacy.`type` = 1
GROUP BY legacy.`user_id`, legacy.`video_id`;
