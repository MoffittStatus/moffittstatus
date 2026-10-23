"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Group,
  GroupInvite,
  GroupMember,
  GroupRole,
  errorMessage,
  getGroup,
  groupInvites,
  inviteToGroup,
  joinGroup,
  leaveGroup,
  removeMember,
  revokeInvite,
  setMemberRole,
  transferOwnership,
} from "@/lib/groups";

const GroupPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myRole, setMyRole] = useState<GroupRole | null>(null);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const isOwner = myRole === "OWNER";
  const isManager = myRole === "OWNER" || myRole === "ADMIN";

  const load = useCallback(async () => {
    try {
      const data = await getGroup(groupId);
      setGroup(data.group);
      setMembers(data.members);
      setMyRole(data.myRole);
      const manager = data.myRole === "OWNER" || data.myRole === "ADMIN";
      setInvites(manager ? await groupInvites(groupId) : []);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // Runs an action, shows any error, and reloads the page data
  const run = async (action: () => Promise<unknown>, success = "") => {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { emailSent } = await inviteToGroup(groupId, inviteEmail, inviteRole);
      setInviteEmail("");
      if (!emailSent) throw new Error("Invite created, but the email failed to send");
    }, `Invite sent to ${inviteEmail}`);
  };

  const handleLeave = () => {
    if (!confirm("Leave this group?")) return;
    run(async () => {
      await leaveGroup(groupId);
      router.push("/groups");
    });
  };

  if (!group) {
    return <div className="max-w-2xl mx-auto p-4">{error ? <p className="text-red-600">{error}</p> : "Loading..."}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 text-slate-800">
      <div>
        <Link className="text-blue-600 underline text-sm" href="/groups">
          ← All groups
        </Link>
        <h1 className="text-3xl font-bold text-[#003262]">{group.name}</h1>
        <p className="text-gray-500 text-sm">
          {group.isPrivate ? "Private" : "Public"} · {group.type === "RSO" ? (group.verified ? "Verified RSO" : "RSO") : "Casual"}
          {myRole && ` · You are ${myRole.toLowerCase()}`}
        </p>
        {group.description && <p className="mt-2">{group.description}</p>}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {notice && <p className="text-green-700">{notice}</p>}

      <div className="flex gap-2">
        {!myRole && !group.isPrivate && (
          <button className="bg-[#003262] text-white rounded px-4 py-2" onClick={() => run(() => joinGroup(groupId))}>
            Join group
          </button>
        )}
        {myRole && !isOwner && (
          <button className="border rounded px-4 py-2" onClick={handleLeave}>
            Leave group
          </button>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">Members ({members.length})</h2>
        <ul className="space-y-2">
          {members.map((m) => {
            const canRemove = m.role !== "OWNER" && (isOwner || (myRole === "ADMIN" && m.role === "MEMBER"));
            const isTarget = isOwner && m.role !== "OWNER";
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-2">
                <div>
                  {m.name || m.email} <span className="text-gray-500 text-sm">({m.role.toLowerCase()})</span>
                </div>
                <div className="flex gap-2 text-sm">
                  {isTarget && (
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => run(() => setMemberRole(groupId, m.id, m.role === "ADMIN" ? "MEMBER" : "ADMIN"))}
                    >
                      {m.role === "ADMIN" ? "Make member" : "Make admin"}
                    </button>
                  )}
                  {isTarget && m.role === "ADMIN" && (
                    <button
                      className="border rounded px-2 py-1"
                      onClick={() => {
                        if (confirm(`Make ${m.name || m.email} the owner? You will become an admin.`)) {
                          run(() => transferOwnership(groupId, m.id), "Ownership transferred");
                        }
                      }}
                    >
                      Make owner
                    </button>
                  )}
                  {canRemove && (
                    <button
                      className="border border-red-300 text-red-600 rounded px-2 py-1"
                      onClick={() => confirm(`Remove ${m.name || m.email}?`) && run(() => removeMember(groupId, m.id))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {isManager && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Invite by email</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
            <input
              className="flex-1 border rounded p-2"
              type="email"
              placeholder="oski@berkeley.edu"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="border rounded p-2"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
            >
              <option value="MEMBER">Member</option>
              {isOwner && <option value="ADMIN">Admin</option>}
            </select>
            <button className="bg-[#003262] text-white rounded px-4 py-2" type="submit">
              Send invite
            </button>
          </form>

          {invites.length > 0 && (
            <>
              <h3 className="font-semibold mt-4 mb-1">Pending invites</h3>
              <ul className="space-y-1">
                {invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between">
                    <span>
                      {inv.email} <span className="text-gray-500 text-sm">({inv.role.toLowerCase()})</span>
                    </span>
                    <button className="text-sm text-red-600 underline" onClick={() => run(() => revokeInvite(groupId, inv.id))}>
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default GroupPage;
