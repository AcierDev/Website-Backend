export interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  orderDate: string;
  createDate: string;
  modifyDate: string;
  paymentDate: string;
  shipByDate: string;
  orderStatus: string;
  customerId: number;
  customerUsername: string;
  customerEmail: string;
  billTo: Address;
  shipTo: Address;
  items: OrderItem[];
  orderTotal: number;
  amountPaid: number;
  taxAmount: number;
  shippingAmount: number;
  customerNotes: string | null;
  internalNotes: string | null;
  gift: boolean;
  giftMessage: string | null;
  paymentMethod: string;
  requestedShippingService: string;
  carrierCode: string | null;
  serviceCode: string | null;
  packageCode: string | null;
  confirmation:
    | "none"
    | "delivery"
    | "signature"
    | "adult_signature"
    | "direct_signature";
  shipDate: string | null;
  holdUntilDate: string | null;
  weight: Weight;
  dimensions: Dimensions;
  insuranceOptions: InsuranceOptions;
  internationalOptions: InternationalOptions;
  advancedOptions: AdvancedOptions;
  tagIds: number[] | null;
  userId: string | null;
  externallyFulfilled: boolean;
  externallyFulfilledBy: string | null;
}

export interface Address {
  name: string;
  company: string | null;
  street1: string;
  street2: string;
  street3: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  residential: boolean | null;
}

export interface Weight {
  value: number;
  units: "ounces" | "pounds" | "grams" | "kilograms";
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  units: "inches" | "centimeters";
}

export interface OrderItem {
  orderItemId: number;
  lineItemKey: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  weight: Weight;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  shippingAmount: number;
  warehouseLocation: string | null;
  options: { name: string; value: string }[];
  productId: number | null;
  fulfillmentSku: string | null;
  adjustment: boolean;
  upc: string | null;
  createDate: string;
  modifyDate: string;
}

interface InsuranceOptions {
  provider: "shipsurance" | "carrier" | "provider" | null;
  insureShipment: boolean;
  insuredValue: number;
}

interface InternationalOptions {
  contents:
    | "merchandise"
    | "documents"
    | "gift"
    | "returned_goods"
    | "sample"
    | null;
  customsItems: CustomsItem[] | null;
  nonDelivery: "return_to_sender" | "treat_as_abandoned" | null;
}

interface CustomsItem {
  customsItemId: number;
  description: string;
  quantity: number;
  value: number;
  harmonizedTariffCode: string;
  countryOfOrigin: string;
}

interface AdvancedOptions {
  warehouseId: number | null;
  nonMachinable: boolean;
  saturdayDelivery: boolean;
  containsAlcohol: boolean;
  storeId: number | null;
  customField1: string;
  customField2: string;
  customField3: string;
  source: string;
  mergedOrSplit: boolean;
  mergedIds: number[];
  parentId: number | null;
  billToParty: "my_account" | "recipient" | "third_party" | null;
  billToAccount: string | null;
  billToPostalCode: string | null;
  billToCountryCode: string | null;
}
