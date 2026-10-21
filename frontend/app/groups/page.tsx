"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Group,
  GroupInvite,
  GroupType,
  createGroup,
  errorMessage,
  isUnauthorized,
  joinGroup,
  listGroups,
  myGroups,
  myInvites,
} from "@/lib/groups";

const GroupsPage: React.FC = () => {
  const [mine, setMine] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [type, setType] = useState<GroupType>("CASUAL");

  const load = useCallback(async () => {
    setError("");
    try {
      setPublicGroups(await listGroups());
      const [m, i] = await Promise.all([myGroups(), myInvites()]);
      setMine(m);
      setInvites(i);
      setSignedOut(false);
    } catch (e) {
      if (isUnauthorized(e)) setSignedOut(true);
      else setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({ name, description, isPrivate, type });
      setName("");
      setDescription("");
      setIsPrivate(false);
      setType("CASUAL");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await joinGroup(id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const myIds = new Set(mine.map((g) => g.id));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 text-slate-800">
      <h1 className="text-3xl font-bold text-[#003262]">Groups</h1>
      {error && <p className="text-red-600">{error}</p>}

      {signedOut ? (
        <p>
          <a className="text-blue-600 underline" href="/login">
            Sign in
          </a>{" "}
          to create and join groups.
        </p>
      ) : (
        <>
          {invites.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Pending invites</h2>
              <ul className="space-y-1">
                {invites.map((inv) => (
                  <li key={inv.id}>
                    <Link className="text-blue-600 underline" href={`/groups/invite/${inv.token}`}>
                      {inv.group?.name}
                    </Link>{" "}
                    <span className="text-gray-500 text-sm">as {inv.role.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-2">My groups</h2>
            {mine.length === 0 && <p className="text-gray-500">You are not in any groups yet.</p>}
            <ul className="space-y-1">
              {mine.map((g) => (
                <li key={g.id}>
                  <Link className="text-blue-600 underline" href={`/groups/${g.id}`}>
                    {g.name}
                  </Link>{" "}
                  <span className="text-gray-500 text-sm">({g.role?.toLowerCase()})</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Create a group</h2>
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                className="w-full border rounded p-2"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
              <textarea
                className="w-full border rounded p-2"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                  Private (invite only)
                </label>
                <select className="border rounded p-1" value={type} onChange={(e) => setType(e.target.value as GroupType)}>
                  <option value="CASUAL">Casual</option>
                  <option value="RSO">RSO</option>
                </select>
              </div>
              <button className="bg-[#003262] text-white rounded px-4 py-2" type="submit">
                Create
              </button>
            </form>
          </section>
        </>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Public groups</h2>
        {publicGroups.filter((g) => !g.isPrivate).length === 0 && <p className="text-gray-500">No public groups yet.</p>}
        <ul className="space-y-2">
          {publicGroups
            .filter((g) => !g.isPrivate)
            .map((g) => (
              <li key={g.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <Link className="text-blue-600 underline" href={`/groups/${g.id}`}>
                    {g.name}
                  </Link>{" "}
                  <span className="text-gray-500 text-sm">
                    {g.type === "RSO" ? (g.verified ? "Verified RSO" : "RSO") : "Casual"} · {g.memberCount} members
                  </span>
                </div>
                {!signedOut && !myIds.has(g.id) && (
                  <button className="border rounded px-3 py-1" onClick={() => handleJoin(g.id)}>
                    Join
                  </button>
                )}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
};

export default GroupsPage;
