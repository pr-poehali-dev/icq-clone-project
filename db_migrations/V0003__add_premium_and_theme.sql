-- Переименовываем password_hash в password (для хранения паролей в открытом виде)
ALTER TABLE t_p20374172_icq_clone_project.users RENAME COLUMN password_hash TO password;

-- Добавляем поля для премиум подписки и темы
ALTER TABLE t_p20374172_icq_clone_project.users ADD COLUMN IF NOT EXISTS is_premium INTEGER DEFAULT 0;
ALTER TABLE t_p20374172_icq_clone_project.users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark';

-- Добавляем поля для групп
ALTER TABLE t_p20374172_icq_clone_project.groups ADD COLUMN IF NOT EXISTS is_bot INTEGER DEFAULT 0;
ALTER TABLE t_p20374172_icq_clone_project.groups ADD COLUMN IF NOT EXISTS premium_only INTEGER DEFAULT 0;

-- Добавляем поля для сообщений (голосовые)
ALTER TABLE t_p20374172_icq_clone_project.group_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE t_p20374172_icq_clone_project.group_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE t_p20374172_icq_clone_project.group_messages ADD COLUMN IF NOT EXISTS duration INTEGER;