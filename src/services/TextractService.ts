import {
  TextractClient,
  AnalyzeDocumentCommand,
  Block,
} from "@aws-sdk/client-textract";
import { LoggerService } from "./LoggerService";
import { promises as fs } from "fs";
import path from "path";

/**
 * Service for extracting tracking numbers from PDF shipping labels using AWS Textract
 */
export class TextractService {
  private static instance: TextractService;
  private client: TextractClient;
  private logger = LoggerService.getInstance();

  private constructor() {
    this.client = new TextractClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Gets the singleton instance of TextractService
   * @returns TextractService instance
   */
  public static getInstance(): TextractService {
    if (!TextractService.instance) {
      TextractService.instance = new TextractService();
    }
    return TextractService.instance;
  }

  /**
   * Extracts tracking number from a PDF shipping label
   * @param filePath - Path to the PDF file
   * @returns Promise resolving to tracking number or null if not found
   * @throws Error if AWS authentication fails or file is invalid
   */
  public async extractTrackingNumber(filePath: string): Promise<string | null> {
    try {
      const fileBuffer = await fs.readFile(filePath);

      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: fileBuffer,
        },
        FeatureTypes: ["FORMS", "TABLES"],
      });

      const response = await this.client.send(command);

      // Look for tracking number in the extracted text
      const trackingNumber = this.findTrackingNumber(response.Blocks || []);

      if (trackingNumber) {
        this.logger.info(`Found tracking number: ${trackingNumber}`);
        return trackingNumber;
      }

      this.logger.warn(
        `No tracking number found in file: ${path.basename(filePath)}`
      );
      return null;
    } catch (error) {
      if ((error as any).name === "AccessDeniedException") {
        this.logger.error("AWS credentials are invalid or missing");
        throw new Error("AWS authentication failed");
      }
      if ((error as any).name === "InvalidS3ObjectException") {
        this.logger.error("Could not read PDF file");
        throw new Error("Invalid PDF file");
      }
      this.logger.error("Error extracting tracking number:", error as Error);
      throw error;
    }
  }

  /**
   * Gets raw text blocks from a PDF file
   * @param filePath - Path to the PDF file
   * @returns Promise resolving to array of text blocks
   */
  public async getTextBlocks(filePath: string): Promise<Block[]> {
    try {
      const fileBuffer = await fs.readFile(filePath);

      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: fileBuffer,
        },
        FeatureTypes: ["FORMS", "TABLES"],
      });

      const response = await this.client.send(command);
      return response.Blocks || [];
    } catch (error) {
      this.logger.error("Error getting text blocks:", error as Error);
      throw error;
    }
  }

  /**
   * Searches for tracking number patterns in extracted text blocks
   * @param blocks - Array of text blocks from Textract
   * @returns Tracking number if found, null otherwise
   */
  private findTrackingNumber(blocks: Block[]): string | null {
    const fullText = blocks.map((block) => block.Text || "").join(" ");

    this.logger.info("Processing text:", fullText);

    const trackingPatterns = [
      // UPS - more flexible pattern
      {
        name: "UPS",
        pattern:
          /\b1Z\s*[A-Z0-9]{3}\s*[A-Z0-9]{3}\s*[A-Z0-9]{2}\s*[A-Z0-9]{4}\s*[A-Z0-9]{4}\b/i,
      },
      // FedEx - handle various formats including middle digit
      {
        name: "FedEx",
        pattern: /\b(?:TRK#\s*)?(\d{4}\s*[\d\s]+\d{4}\s*\d{4})\b/,
        validate: (num: string) => {
          // Remove all spaces and check if it's a valid FedEx number
          const cleaned = num.replace(/\s/g, "");
          // FedEx numbers should be 12 digits and typically appear after TRK#
          return cleaned.length === 12 && /^\d+$/.test(cleaned);
        },
      },
      // USPS
      {
        name: "USPS",
        pattern:
          /\b(?:9\d{15,21}|9\d{3}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{4}[\s-]*\d{2})\b/,
      },
    ];

    // Look for tracking numbers in the full text
    for (const { name, pattern, validate } of trackingPatterns) {
      const matches = fullText.matchAll(new RegExp(pattern, "g"));

      for (const match of Array.from(matches)) {
        // Get the actual number, handling capture groups
        const number = match[1] || match[0];
        const cleanNumber = number.replace(/[\s-]/g, "");

        // Skip if validation fails
        if (validate && !validate(number)) {
          this.logger.info(`Skipping invalid ${name} number:`, number);
          continue;
        }

        // Additional validation - check if it's near tracking-related text
        const contextRange = 200;
        const matchIndex = fullText.indexOf(match[0]);
        const context = fullText
          .substring(
            Math.max(0, matchIndex - contextRange),
            Math.min(
              fullText.length,
              matchIndex + match[0].length + contextRange
            )
          )
          .toLowerCase();

        const trackingKeywords = [
          "tracking",
          "trk#",
          "track",
          "shipment",
          "ups",
          "fedex",
          "usps",
          "shipping",
          "label",
          "delivery",
        ];

        const hasTrackingContext = trackingKeywords.some((keyword) =>
          context.includes(keyword)
        );

        if (hasTrackingContext) {
          this.logger.info(`Found ${name} tracking number: ${cleanNumber}`);
          this.logger.info("In context:", context);
          return cleanNumber;
        } else {
          this.logger.info(
            `Found possible ${name} number but no tracking context:`,
            cleanNumber
          );
        }
      }
    }

    return null;
  }
}
