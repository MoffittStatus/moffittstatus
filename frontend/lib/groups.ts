import axios from "axios";
import { BACKEND_URL } from "./apiEndPoints";

export type GroupType = "RSO" | "CASUAL";
export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Group {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  type: GroupType;
  verified: boolean;
  createdAt: string;
  memberCount?: number;
  role?: GroupRole; // only on /mine
}

export interface GroupMember {
  id: number;
  name: string | null;
  email: string;
  role: GroupRole;
  joinedAt: string;
}

export interface GroupInvite {
  id: number;
  email: string;
  role: GroupRole;
  status: string;
  token?: string; // only on /invites/mine, for the invitee
  createdAt: string;
  expiresAt: string;
  group?: { id: number; name: string; description?: string | null; type: GroupType };
  createdBy?: { name: string | null; email: string };
  expired?: boolean;
  emailMatches?: boolean;
}

// Session lives in an httpOnly cookie, so every call must send credentials
const groupsApi = axios.create({ baseURL: BACKEND_URL + "/api/groups", withCredentials: true });

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) return e.response?.data?.error ?? e.message;
  return "Something went wrong";
}

export function isUnauthorized(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 401;
}

export const listGroups = async (q = "") =>
  (await groupsApi.get<{ groups: Group[] }>("/", { params: q ? { q } : {} })).data.groups;

export const myGroups = async () => (await groupsApi.get<{ groups: Group[] }>("/mine")).data.groups;

export const createGroup = async (data: { name: string; description: string; isPrivate: boolean; type: GroupType }) =>
  (await groupsApi.post<{ group: Group }>("/", data)).data.group;

export const getGroup = async (id: number) =>
  (await groupsApi.get<{ group: Group; members: GroupMember[]; myRole: GroupRole | null }>(`/${id}`)).data;

export const joinGroup = (id: number) => groupsApi.post(`/${id}/join`);
export const leaveGroup = (id: number) => groupsApi.post(`/${id}/leave`);

export const inviteToGroup = async (id: number, email: string, role: "ADMIN" | "MEMBER") =>
  (await groupsApi.post<{ invite: GroupInvite; emailSent: boolean }>(`/${id}/invites`, { email, role })).data;

export const groupInvites = async (id: number) =>
  (await groupsApi.get<{ invites: GroupInvite[] }>(`/${id}/invites`)).data.invites;

export const revokeInvite = (id: number, inviteId: number) => groupsApi.delete(`/${id}/invites/${inviteId}`);

export const setMemberRole = (id: number, userId: number, role: "ADMIN" | "MEMBER") =>
  groupsApi.patch(`/${id}/members/${userId}`, { role });

export const removeMember = (id: number, userId: number) => groupsApi.delete(`/${id}/members/${userId}`);

export const transferOwnership = (id: number, userId: number) =>
  groupsApi.post(`/${id}/transfer-ownership`, { userId });

export const myInvites = async () => (await groupsApi.get<{ invites: GroupInvite[] }>("/invites/mine")).data.invites;

export const getInvite = async (token: string) =>
  (await groupsApi.get<{ invite: GroupInvite }>(`/invites/${token}`)).data.invite;

export const acceptInvite = async (token: string) =>
  (await groupsApi.post<{ groupId: number }>(`/invites/${token}/accept`)).data;

export const rejectInvite = (token: string) => groupsApi.post(`/invites/${token}/reject`);
