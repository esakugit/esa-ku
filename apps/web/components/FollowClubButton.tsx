"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function FollowClubButton({
  clubId,
  isLoggedIn,
  hasActiveBadge,
}: {
  clubId: number;
  isLoggedIn: boolean;
  hasActiveBadge: boolean;
}) {
  const [following, setFollowing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((rows: { subjectType: string; subjectId: number }[]) => {
        setFollowing(rows.some((r) => r.subjectType === "club" && r.subjectId === clubId));
        setLoaded(true);
      });
  }, [clubId, isLoggedIn]);

  if (!isLoggedIn) return null;

  if (!hasActiveBadge) {
    return (
      <Link href="/profile" className="lock-chip mt-4 inline-flex">
        Badge to follow for reminders
      </Link>
    );
  }

  async function toggle() {
    if (following) {
      await fetch(`/api/subscriptions?subjectType=club&subjectId=${clubId}`, { method: "DELETE" });
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectType: "club", subjectId: clubId }),
      });
    }
    setFollowing((v) => !v);
  }

  return (
    <button onClick={toggle} disabled={!loaded} className={following ? "btn-secondary mt-4" : "btn-primary mt-4"}>
      {following ? "Following · get event reminders" : "Follow for event reminders"}
    </button>
  );
}
