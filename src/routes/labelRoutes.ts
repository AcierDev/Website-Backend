import express from "express";
import multer from "multer";
import { LabelController } from "../controllers/LabelController";
import { uploadConfig } from "../config/uploadConfig";

const router = express.Router();
const upload = multer(uploadConfig);
const labelController = new LabelController();

router.post(
  "/upload-label",
  upload.single("label"),
  labelController.uploadLabel
);
router.get("/pdf/:filename", labelController.getPdf);
router.get("/pdfs/:orderId", labelController.getPdfsForOrder);
router.get("/pdf-exists/:filename", labelController.checkPdfExists);
router.get("/pdfs", labelController.getAllPdfs);
router.get("/filenames", labelController.getAllFilenames);
router.delete("/pdf/:filename", labelController.deletePdf);

export default router;
