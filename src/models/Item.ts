import { Address } from "./ShipStationOrder";

export interface Item {
  id: string;
  values: ColumnValue[];
  createdAt: number;
  completedAt?: number;
  status: ItemStatus;
  vertical?: boolean;
  visible: boolean;
  deleted: boolean;
  isScheduled?: boolean;
  shippingDetails: Address;
}

export type ColumnValue = ColorColumnValue | GenericColumnValue;

export interface ColorColumnValue {
  text?: ItemDesigns;
  type: ColumnTypes.Dropdown;
  columnName: ColumnTitles.Design;
  lastModifiedTimestamp?: number;
  credit?: EmployeeNames[];
}

export interface GenericColumnValue {
  text?: string;
  type: ColumnTypes;
  columnName: ColumnTitles;
  lastModifiedTimestamp?: number;
  credit?: EmployeeNames[];
}

export enum ItemStatus {
  Hidden = "Hidden",
  New = "New",
  OnDeck = "On Deck",
  Wip = "Wip",
  Packaging = "Packaging",
  At_The_Door = "At The Door",
  Done = "Done",
}

export enum ColumnTitles {
  Customer_Name = "Customer Name",
  Design = "Design",
  Size = "Size",
  Due = "Due Date",
  Painted = "Painted",
  Backboard = "Backboard",
  Glued = "Glued",
  Packaging = "Packaging",
  Boxes = "Boxes",
  Notes = "Notes",
  Rating = "Rating",
  Labels = "Labels",
}

export enum ColumnTypes {
  Dropdown = "dropdown",
  Text = "text",
  Number = "number",
  Date = "date",
}

export enum ItemDesigns {
  Coastal = "Coastal",
  Striped_Coastal = "Striped Coastal",
  Tiled_Coastal = "Tiled Coastal",
  Lawyer = "Lawyer",
  Fade_To_Five = "Fade To Five",
  Striped_Fade_To_Five = "Striped Fade To Five",
  Tiled_Fade_To_Five = "Tiled Fade To Five",
  Timberline = "Timberline",
  Striped_Timberline = "Striped Timberline",
  Tiled_Timberline = "Tiled Timberline",
  Amber = "Amber",
  Sapphire = "Sapphire",
  Winter = "Winter",
  Forest = "Forest",
  Autumn = "Autumn",
  Elemental = "Elemental",
  Abyss = "Abyss",
  Spectrum = "Spectrum",
  Aloe = "Aloe",
  Mirage = "Mirage",
}

export enum ItemSizes {
  Fourteen_By_Seven = "14 x 7",
  Sixteen_By_Six = "16 x 6",
  Sixteen_By_Ten = "16 x 10",
  Twenty_By_Ten = "20 x 10",
  TwentyFour_By_Ten = "24 x 10",
  Twenty_By_Twelve = "20 x 12",
  TwentyFour_By_Twelve = "24 x 12",
  TwentyEight_By_Twelve = "28 x 12",
  TwentyEight_By_Sixteen = "28 x 16",
  ThirtyTwo_By_Sixteen = "32 x 16",
  ThirtySix_By_Sixteen = "36 x 16",
}

export enum EmployeeNames {
  Alex = "Alex Morrell",
  Ben = "Ben Clark",
  Bentzi = "Ben Steele",
  Akiva = "Akiva Weil",
  Paris = "Paris Carver",
  Dylan = "Dylan Carver",
  Tyler = "Tyler Blancett",
}
