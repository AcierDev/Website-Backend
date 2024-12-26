import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { uploadDir } from "../config/uploadConfig";
import { LoggerService } from "../services/LoggerService";

export class LabelController {
  private logger = LoggerService.getInstance();

  public uploadLabel = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).send("No file uploaded or file is not a PDF.");
      return;
    }

    const originalFilename = req.file.filename;
    let customFilename = req.query.filename as string;

    try {
      if (customFilename) {
        if (!customFilename.toLowerCase().endsWith(".pdf")) {
          customFilename += ".pdf";
        }
      } else {
        customFilename = originalFilename;
      }

      const oldPath = path.join(uploadDir, originalFilename);
      const newPath = path.join(uploadDir, customFilename);

      await fs.rename(oldPath, newPath);
      res
        .status(200)
        .send(`File uploaded successfully. Saved as: ${customFilename}`);
    } catch (error) {
      this.logger.error("Error saving file:", error as Error);
      res.status(500).send("Error saving file with custom filename.");
    }
  };

  public getPdf = async (req: Request, res: Response): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    try {
      await fs.access(filePath);
      res.contentType("application/pdf");
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).send("PDF not found");
    }
  };

  public getPdfsForOrder = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { orderId } = req.params;
    try {
      const files = await fs.readdir(uploadDir);
      const pdfFiles = files
        .filter((file) => {
          const fileName = file.toLowerCase();
          return (
            fileName === `${orderId}.pdf` ||
            (fileName.startsWith(`${orderId}-`) &&
              path.extname(fileName) === ".pdf")
          );
        })
        .sort((a, b) => {
          if (a.toLowerCase() === `${orderId}.pdf`) return -1;
          if (b.toLowerCase() === `${orderId}.pdf`) return 1;
          return a.localeCompare(b);
        });

      res.json(pdfFiles);
    } catch (error) {
      this.logger.error("Error reading PDF directory:", error as Error);
      res.status(500).send("Error retrieving PDFs");
    }
  };

  public checkPdfExists = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    const deletedFilePath = path.join(uploadDir, `deleted_${filename}`);

    try {
      await fs.access(filePath);
      res.status(200).send({ exists: true });
    } catch {
      try {
        await fs.access(deletedFilePath);
        res.status(200).send({ exists: false });
      } catch {
        res.status(404).send({ exists: false });
      }
    }
  };

  public getAllPdfs = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = await fs.readdir(uploadDir);
      const pdfFiles = files.filter(
        (file) => path.extname(file).toLowerCase() === ".pdf"
      );
      res.json(pdfFiles);
    } catch (error) {
      this.logger.error("Error reading PDF directory:", error as Error);
      res.status(500).send("Error retrieving PDFs");
    }
  };

  public getAllFilenames = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const files = await fs.readdir(uploadDir);
      res.json(files);
    } catch (error) {
      this.logger.error("Error reading directory:", error as Error);
      res.status(500).send("Error retrieving filenames");
    }
  };

  public deletePdf = async (req: Request, res: Response): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    const newFilePath = path.join(uploadDir, `deleted_${filename}`);

    try {
      await fs.access(filePath);
      await fs.rename(filePath, newFilePath);
      res.status(200).send("PDF marked as deleted successfully");
    } catch (error) {
      this.logger.error("Error marking PDF as deleted:", error as Error);
      res.status(404).send("PDF not found or could not be marked as deleted");
    }
  };
}
