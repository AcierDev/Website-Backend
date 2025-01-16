import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI("AIzaSyB3t6b3Jl9FLN37nJUq95IkOTqoSDwXWtE");

async function fileToGenerativePart(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };
}
async function extractTrackingNumber(filePath: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Extract the tracking number from this shipping label.
    Return ONLY a raw JSON object (no markdown, no code blocks) with these fields:
    {
      "trackingNumber": "<number with no spaces>",
      "carrier": "<FedEx|UPS|USPS|DHL>",
      "sender": "<sender name or null>",
      "receiver": "<receiver name or null>"
    }
    
    Common tracking number formats:
    - FedEx: #### #### #### (12 digits)
    - UPS: 1Z#### #### #### #### (18 characters)
    - USPS: #### #### #### #### #### ## (22 digits)`;

    const imagePart = await fileToGenerativePart(filePath);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text().trim();

    // Remove any markdown code block syntax if present
    text = text.replace(/```json\s*|\s*```/g, "");

    console.log(`File: ${path.basename(filePath)}`);

    const parsed = JSON.parse(text);
    console.log("Extracted data:", parsed);
    console.log("-".repeat(80));

    return parsed;
  } catch (error) {
    console.error("Error processing file:", error);
    return null;
  }
}

async function testGemini() {
  const labelsDir = path.join(process.cwd(), "res", "labels");

  try {
    const files = await fs.readdir(labelsDir);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    console.log(`Found ${pdfFiles.length} PDF files\n`);

    const results = await Promise.all(
      pdfFiles.map((file) => extractTrackingNumber(path.join(labelsDir, file)))
    );

    results.forEach((result, index) => {
      if (result) {
        console.log(`Results for file ${pdfFiles[index]}:`, result);
        console.log("-".repeat(80));
      }
    });
  } catch (error) {
    console.error("Error listing files:", error);
  }
}

// Add GEMINI_API_KEY to .env first
if (!process.env.GEMINI_API_KEY) {
  console.error("Please add GEMINI_API_KEY to your .env file");
  process.exit(1);
}

testGemini();
