import { Item } from "./Item";

export interface Board {
  id: string;
  name: string;
  items_page: ItemsResponse;
  weeklySchedules: WeeklySchedules;
}

export interface ItemsResponse {
  cursor: string;
  items: Item[];
}

export type WeeklySchedules = Record<string, Record<DayName, any[]>>;
export type DayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";
