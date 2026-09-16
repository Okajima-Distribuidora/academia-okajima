-- Ready means Vimeo finished processing. Without a separate moderation flow,
-- existing ready videos are approved automatically while privacy remains the
-- source of truth for public/private visibility.
UPDATE `videos`
SET `approved` = 1
WHERE `upload_status` = 'ready'
  AND `approved` <> 1
  AND `deleted_at` IS NULL;
