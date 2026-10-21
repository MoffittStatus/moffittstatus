"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GroupInvite, acceptInvite, errorMessage, getInvite, isUnauthorized, rejectInvite } from "@/lib/groups";

const InvitePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token);

  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    getInvite(token)
      .then(setInvite)
      .catch((e) => (isUnauthorized(e) ? setSignedOut(true) : setError(errorMessage(e))));
  }, [token]);

  const handleAccept = async () => {
    try {
      const { groupId } = await acceptInvite(token);
      router.push(`/groups/${groupId}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleReject = async () => {
    try {
      await rejectInvite(token);
      setDeclined(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  let body: React.ReactNode;
  if (signedOut) {
    body = (
      <p>
        <a className="text-blue-600 underline" href="/login">
          Sign in
        </a>{" "}
        with your berkeley.edu account to view this invite.
      </p>
    );
  } else if (declined) {
    body = <p>You declined the invite.</p>;
  } else if (!invite) {
    body = error ? null : <p>Loading...</p>;
  } else if (invite.status !== "PENDING" || invite.expired) {
    body = <p>This invite is no longer valid ({invite.expired ? "expired" : invite.status.toLowerCase()}).</p>;
  } else if (!invite.emailMatches) {
    body = <p>This invite was sent to {invite.email}. Sign in with that account to respond.</p>;
  } else {
    body = (
      <>
        <p>
          {invite.createdBy?.name || invite.createdBy?.email} invited you to join <strong>{invite.group?.name}</strong> as{" "}
          {invite.role === "ADMIN" ? "an admin" : "a member"}.
        </p>
        {invite.group?.description && <p className="text-gray-600">{invite.group.description}</p>}
        <div className="flex gap-2">
          <button className="bg-[#003262] text-white rounded px-4 py-2" onClick={handleAccept}>
            Accept
          </button>
          <button className="border rounded px-4 py-2" onClick={handleReject}>
            Decline
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 text-slate-800">
      <h1 className="text-2xl font-bold text-[#003262]">Group invite</h1>
      {error && <p className="text-red-600">{error}</p>}
      {body}
    </div>
  );
};

export default InvitePage;
