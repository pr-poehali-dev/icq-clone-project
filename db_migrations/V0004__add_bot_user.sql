-- Обновление пользователя Snos
UPDATE t_p20374172_icq_clone_project.users 
SET password = '122', bio = 'Администратор | Обработка жалоб', is_premium = 1 
WHERE username = 'Snos';

-- Создание премиум бота СНОС
INSERT INTO t_p20374172_icq_clone_project.users (username, password, bio, avatar_url, is_premium, status) 
VALUES ('СНОС', 'bot_snos_2024', 'Премиум бот | Только для VIP пользователей', '', 1, 'online');