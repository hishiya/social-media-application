import { Request, Response } from "express";

// uploadFile — контролер для завантаження файлу
// Цей контролер викликається ПІСЛЯ того як multer вже обробив файл
// тобто до цього моменту файл вже збережено в папку uploads/ і req.file заповнений
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ message: 'Файл не отримано' })
        return;
    }

    const url = `http://localhost:5000/uploads/${req.file.filename}`;
    res.status(200).json({ url });
}