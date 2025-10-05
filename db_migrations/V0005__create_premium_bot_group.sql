-- Создание группы для премиум бота СНОС
INSERT INTO t_p20374172_icq_clone_project.groups (name, description, created_by, is_bot, premium_only, created_at)
SELECT 'СНОС', 'Только для премиум', id, 1, 1, CURRENT_TIMESTAMP 
FROM t_p20374172_icq_clone_project.users 
WHERE username = 'СНОС' LIMIT 1;