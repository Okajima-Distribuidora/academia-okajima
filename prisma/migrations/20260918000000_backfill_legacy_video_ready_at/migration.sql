-- The upload-lifecycle migration initially gave every legacy ready video the
-- migration timestamp. Restore the original catalog date from the legacy Unix
-- timestamp, but only for rows bearing that initial placeholder. This makes
-- the migration safe for rows created by the new Vimeo upload flow.
UPDATE `videos`
SET `ready_at` = FROM_UNIXTIME(`time`)
WHERE `upload_status` = 'ready'
  AND `time` > 0
  AND `ready_at` = `upload_status_updated_at`;
