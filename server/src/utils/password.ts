import bcrypt from 'bcryptjs';

// Функція для хешування паролю
// Приймає звичайний пароль (рядок), повертає Promise<string> — тобто хеш асинхронно
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export const comparePassword = async (
    password: string,
    hash: string,   
) : Promise<boolean> => {
    return bcrypt.compare(password, hash);
}