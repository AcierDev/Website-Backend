export interface TrackingInfo {
  orderId: string;
  filename: string;
  trackingNumber: string;
  carrier?: "UPS" | "USPS" | "FedEx" | "DHL";
  createdAt: number;
}
