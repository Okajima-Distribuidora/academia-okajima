-- New accounts created by the administrative panel must replace their
-- temporary password after the first successful login. Existing accounts keep
-- the default (false), preserving their current login behavior.
ALTER TABLE `users`
  ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0;
