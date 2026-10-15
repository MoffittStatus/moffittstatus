export type LibrarySlug =
  | "all"
  | "main_stacks"
  | "moffitt"
  | "kresge"
  | "earth_sciences"
  | "east_asian"
  | "environmental_design"
  | "igs"
  | "business"
  | "social_research";

export interface LibraryOption {
  slug: LibrarySlug;
  name: string;
}

export interface RoomSlot {
  time: string;
  checksum?: string;
  startHour: number;
  rawStartTime: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
  librarySlug: string;
  libraryName: string;
  slots: RoomSlot[];
}

export interface RawRoomSlot {
  id: string;
  name: string;
  time: string;
  checksum?: string;
  librarySlug?: string;
}

export interface GroupedLibraryRooms {
  slug: string;
  name: string;
  rooms: Room[];
}

export type GroupedRooms = Record<string, GroupedLibraryRooms>;