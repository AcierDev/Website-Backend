import { TextractService } from "../services/TextractService";
import path from "path";
import dotenv from "dotenv";
import { promises as fs } from "fs";

// Load environment variables
dotenv.config();

async function analyzePdf(filePath: string) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    console.log(`\nTesting file: ${path.basename(filePath)}`);
    console.log(`File size: ${fileBuffer.length} bytes`);

    const header = fileBuffer.toString("ascii", 0, 8);
    if (!header.startsWith("%PDF-")) {
      console.error("Warning: File does not appear to be a valid PDF");
      return;
    }

    const service = TextractService.getInstance();

    // Get raw text blocks for debugging
    const rawBlocks = await service.getTextBlocks(filePath);

    console.log("\nRaw text blocks:");
    rawBlocks.forEach((block, index) => {
      if (block.Text) {
        console.log(`Block ${index}: "${block.Text}"`);
      }
    });

    const trackingNumber = await service.extractTrackingNumber(filePath);

    if (trackingNumber) {
      // Find the block containing the tracking number for context
      const contextBlock = rawBlocks.find((block) =>
        block.Text?.includes(trackingNumber)
      );
      console.log("\nFound tracking number:", trackingNumber);
      console.log("In context:", contextBlock?.Text);

      // Validate tracking number format
      const isUPS = /^1Z[A-Z0-9]{16}$/.test(trackingNumber);
      const isFedEx = /^\d{12}$/.test(trackingNumber);
      const isUSPS = /^\d{20,22}$/.test(trackingNumber);
      const isDHL = /^\d{10}$/.test(trackingNumber);

      console.log(
        "Appears to be:",
        isUPS
          ? "UPS"
          : isFedEx
          ? "FedEx"
          : isUSPS
          ? "USPS"
          : isDHL
          ? "DHL"
          : "Unknown carrier"
      );
    } else {
      console.log("No tracking number found");
    }

    console.log("-".repeat(80));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function testMultiplePdfs() {
  const labelsDir = path.join(process.cwd(), "res", "labels");

  try {
    const files = await fs.readdir(labelsDir);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );
    console.log(`Found ${pdfFiles.length} PDF files`);

    for (const file of pdfFiles) {
      await analyzePdf(path.join(labelsDir, file));
    }
  } catch (error) {
    console.error("Error listing files:", error);
  }
}

// Run the tests
testMultiplePdfs();
