import { Request, Response } from "express";

export const uploadFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: "Файл не отримано" });
    return;
  }

  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.status(200).json({ url });
};
