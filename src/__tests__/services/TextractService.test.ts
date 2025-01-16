import { TextractService } from "../../services/TextractService";
import { TextractClient } from "@aws-sdk/client-textract";
import path from "path";
import { promises as fs } from "fs";

// Mock fs.readFile
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from("mock pdf content")),
  },
}));

// Mock the AWS SDK
jest.mock("@aws-sdk/client-textract", () => ({
  TextractClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  AnalyzeDocumentCommand: jest.fn(),
}));

describe("TextractService", () => {
  const service = TextractService.getInstance();
  const mockTextractClient = TextractClient as jest.Mock;
  const mockReadFile = fs.readFile as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should extract tracking number when present", async () => {
    // Mock AWS response
    mockTextractClient.mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Blocks: [
          { Text: "Some text" },
          { Text: "1Z999AA1234567890" }, // UPS tracking number
          { Text: "Other text" },
        ],
        $metadata: { httpStatusCode: 200 },
      }),
    }));

    const testPdfPath = path.join(__dirname, "test-label.pdf"); // Path doesn't matter since fs is mocked
    const trackingNumber = await service.extractTrackingNumber(testPdfPath);
    expect(trackingNumber).toBe("1Z999AA1234567890");
  });

  it("should return null when no tracking number found", async () => {
    // Mock AWS response with no tracking number
    mockTextractClient.mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Blocks: [{ Text: "Some text" }, { Text: "Other text" }],
        $metadata: { httpStatusCode: 200 },
      }),
    }));

    const testPdfPath = path.join(__dirname, "no-tracking.pdf");
    const trackingNumber = await service.extractTrackingNumber(testPdfPath);
    expect(trackingNumber).toBeNull();
  });

  it("should handle AWS authentication errors", async () => {
    mockReadFile.mockResolvedValueOnce(Buffer.from("mock pdf content"));
    mockTextractClient.mockImplementation(() => ({
      send: jest.fn().mockRejectedValue({
        name: "AccessDeniedException",
        message: "Access denied",
      }),
    }));

    const testPdfPath = path.join(__dirname, "test-label.pdf");
    await expect(service.extractTrackingNumber(testPdfPath)).rejects.toThrow(
      "AWS authentication failed"
    );
  });
});
