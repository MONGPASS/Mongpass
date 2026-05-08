-- Track when each side (customer / shop owner) last read a chat thread.
-- A thread is considered "unread" for a side when last_message_at is
-- newer than that side's last-read timestamp.
--
-- We send-mark-as-read on the sender side at write time, so an unread
-- bubble only appears when the OTHER side's message is newer than your
-- own last visit.

ALTER TABLE chat_threads ADD COLUMN user_last_read_at TEXT;
ALTER TABLE chat_threads ADD COLUMN shop_last_read_at TEXT;
