import { useEffect, useState } from "react";
import { doc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, configured } from "./firebase";

// Defaults show until the admin saves real values. Social URLs are editable placeholders.
export const DEFAULTS = {
  name: "ClashDaSarva",
  tagline: "Clash. Create. Conquer.",
  description: "Clash of Clans content creator bringing you gameplay, updates, leaks, strategies, shorts and more!",
  subscribers: 300,
  logoUrl: "",
  profileUrl: "",
  announcement: "",
  youtubeChannelId: "",
  contactEmail: "",
  socials: [
    { id: "youtube", label: "YouTube", handle: "@ClashDaSarva", blurb: "Subscribe for amazing CoC content!", url: "https://www.youtube.com/@ClashDaSarva" },
    { id: "instagram", label: "Instagram", handle: "@clashdasarva", blurb: "Reels & updates!", url: "https://www.instagram.com/clashdasarva" },
    { id: "twitch", label: "Twitch", handle: "@clashdasarva", blurb: "Live streams!", url: "https://www.twitch.tv/clashdasarva" },
    { id: "x", label: "X (Twitter)", handle: "@ClashDaSarva", blurb: "Stay connected!", url: "https://x.com/ClashDaSarva" },
    { id: "discord", label: "Discord", handle: "", blurb: "Join our community server!", url: "https://discord.gg/" },
  ],
  achievements: [
    { target: 300, label: "300+" },
    { target: 500, label: "500" },
    { target: 1000, label: "1K" },
    { target: 5000, label: "5K" },
    { target: 10000, label: "10K" },
  ],
};

export function useSite() {
  const [st, setSt] = useState({ data: DEFAULTS, loading: configured, error: configured ? null : "not-configured" });
  useEffect(() => {
    if (!configured) return;
    return onSnapshot(
      doc(db, "site", "config"),
      (snap) => setSt({ data: { ...DEFAULTS, ...(snap.data() || {}) }, loading: false, error: null }),
      (err) => setSt({ data: DEFAULTS, loading: false, error: err.message })
    );
  }, []);
  return st;
}

export function useCol(name, orderField) {
  const [st, setSt] = useState({ data: [], loading: configured, error: null });
  useEffect(() => {
    if (!configured) return;
    return onSnapshot(
      query(collection(db, name), orderBy(orderField, "desc")),
      (snap) => setSt({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (err) => setSt({ data: [], loading: false, error: err.message })
    );
  }, [name, orderField]);
  return st;
}

export const ytId = (u = "") => {
  const m = u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : "";
};

export const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  if (Number.isNaN(days)) return "";
  const p = (n, w) => `${n} ${w}${n > 1 ? "s" : ""} ago`;
  if (days < 1) return "Today";
  if (days < 7) return p(days, "day");
  if (days < 30) return p(Math.floor(days / 7), "week");
  if (days < 365) return p(Math.floor(days / 30), "month");
  return p(Math.floor(days / 365), "year");
};
