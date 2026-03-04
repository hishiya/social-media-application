import multer from "multer"
import path from 'path'
import crypto from 'crypto'

// diskStorage — об'єкт, який описує ДЕ і ЯК зберігати файли на диск
const storage = multer.diskStorage({

    // destination — папка, куди зберігати файли
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },

    filename: (req, file, cb) => {
        // Генеруємо унікальне ім'я файлу, щоб уникнути колізій
        const uniquePrefix = crypto.randomBytes(16).toString('hex');
        // path.extname(file.originalname) — отримує розширення файлу (наприклад, .jpg)
        const ext = path.extname(file.originalname);
        cb(null, `${uniquePrefix}${ext}`);
    }
});

// fileFilter — функція, яка перевіряє тип файлу і вирішує, чи приймати його
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback // callback, який приймає помилку (якщо є) і булеве значення (приймати чи ні)
) => {
    // file.mimetype - тип файлу (наприклад, 'image/jpeg' або 'video/mp4')
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (isImage || isVideo) {
        // Якщо це зображення або відео — приймаємо файл
        cb(null, true);
    } else {
        cb(new Error('Тільки зображення та відео дозволені'));
    }
}

// Створюємо об'єкт upload з нашими налаштуваннями
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 МБ
    }
})