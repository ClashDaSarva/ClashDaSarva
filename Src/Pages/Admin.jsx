import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, configured, ADMIN_EMAIL, YT_KEY } from "../firebase";
import { useSite, useCol, ytId } from "../data";
import { Loading, ErrorBox } from "../components/ui";

const saveSite = (patch) => setDoc(doc(db, "site", "config"), patch, { merge: true });

function useRun() {
  const [st, setSt] = useState(null);
  const run = async (fn, ok = "Saved ✓") => {
    setSt({ t: "busy", m: "Working…" });
    try { await fn(); setSt({ t: "ok", m: ok }); } catch (e) { setSt({ t: "err", m: e.message }); }
  };
  return [st, run];
}
const Status = ({ st }) => (st ? <span className={`st ${st.t}`} role="status">{st.m}</span> : null);

function Login() {
  const [f, setF] = useState({ email: "", pass: "" });
  const [st, run] = useRun();
  const submit = (e) => { e.preventDefault(); run(() => signInWithEmailAndPassword(auth, f.email, f.pass), "Signed in"); };
  return (
    <main className="wrap legal">
      <form className="panel" onSubmit={submit}>
        <h1 className="display outline sm">Admin Login</h1>
        <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></label>
        <button className="btn gold" disabled={st?.t === "busy"}>Sign in</button> <Status st={st} />
        <p><Link to="/">← Back to site</Link></p>
      </form>
    </main>
  );
}

function ImageField({ label, value, folder, onChange }) {
  const [st, run] = useRun();
  const pick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    run(async () => {
      const r = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      onChange(await getDownloadURL(r));
    }, "Uploaded – click Save to publish");
  };
  return (
    <div className="field">
      <span>{label}</span>
      {value && <img src={value} alt="" className="prev-img" />}
      <input type="file" accept="image/*" onChange={pick} />
      <input placeholder="…or paste an image URL" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      <Status st={st} />
    </div>
  );
}

function General({ s }) {
  const [f, setF] = useState({ ...s });
  const [st, run] = useRun();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    run(() => saveSite({ name: f.name, tagline: f.tagline, description: f.description, subscribers: Number(f.subscribers) || 0, youtubeChannelId: f.youtubeChannelId, contactEmail: f.contactEmail, logoUrl: f.logoUrl || "", profileUrl: f.profileUrl || "" }));
  };
  return (
    <form className="panel" onSubmit={save}>
      <ImageField label="Logo" value={f.logoUrl} folder="branding" onChange={(v) => setF((p) => ({ ...p, logoUrl: v }))} />
      <ImageField label="Profile picture" value={f.profileUrl} folder="branding" onChange={(v) => setF((p) => ({ ...p, profileUrl: v }))} />
      <label>Creator name<input value={f.name} onChange={set("name")} required /></label>
      <label>Tagline<input value={f.tagline} onChange={set("tagline")} /></label>
      <label>Introduction<textarea rows="3" value={f.description} onChange={set("description")} /></label>
      <label>Subscriber count<input type="number" min="0" value={f.subscribers} onChange={set("subscribers")} /></label>
      <label>YouTube channel ID (for API sync)<input placeholder="UC…" value={f.youtubeChannelId} onChange={set("youtubeChannelId")} /></label>
      <label>Contact email<input type="email" value={f.contactEmail} onChange={set("contactEmail")} /></label>
      <button className="btn gold">Save changes</button> <Status st={st} />
    </form>
  );
}

function ListEditor({ s, field, cols, blank, fixed }) {
  const [rows, setRows] = useState(s[field]);
  const [st, run] = useRun();
  const upd = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="panel">
      {rows.map((r, i) => (
        <div className="row" key={i}>
          {cols.map((c) => (
            <input key={c.k} aria-label={c.p} placeholder={c.p} type={c.type || "text"} value={r[c.k] ?? ""}
              onChange={(e) => upd(i, c.k, c.type === "number" ? Number(e.target.value) : e.target.value)} />
          ))}
          {!fixed && <button className="mini danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Delete</button>}
        </div>
      ))}
      {!fixed && <button className="btn dark sm" onClick={() => setRows([...rows, blank])}>Add row</button>}{" "}
      <button className="btn gold sm" onClick={() => run(() => saveSite({ [field]: rows }))}>Save changes</button> <Status st={st} />
    </div>
  );
}

function Announcement({ s }) {
  const [t, setT] = useState(s.announcement || "");
  const [st, run] = useRun();
  return (
    <div className="panel">
      <label>Announcement shown at the top of the site<textarea rows="3" value={t} onChange={(e) => setT(e.target.value)} /></label>
      <button className="btn gold sm" onClick={() => run(() => saveSite({ announcement: t.trim() }), "Published ✓")}>Publish</button>{" "}
      <button className="btn dark sm" onClick={() => run(async () => { await saveSite({ announcement: "" }); setT(""); }, "Cleared ✓")}>Clear</button> <Status st={st} />
    </div>
  );
}

const decode = (h) => new DOMParser().parseFromString(h, "text/html").documentElement.textContent;

function Crud({ col, order, fields, blank, label, summary, channelId }) {
  const { data, loading, error } = useCol(col, order);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [st, run] = useRun();
  const reset = () => { setForm(blank); setEditId(null); };
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const p = { ...form };
      if (col === "videos") {
        if (!ytId(p.url)) throw new Error("Enter a valid YouTube video link.");
        if (!p.date) p.date = new Date().toISOString().slice(0, 10);
      }
      if (editId) await updateDoc(doc(db, col, editId), p);
      else await addDoc(collection(db, col), { ...p, createdAt: Date.now() });
      reset();
    }, editId ? "Updated ✓" : "Added ✓");
  };
  const del = (id) => confirm("Delete this item?") && run(() => deleteDoc(doc(db, col, id)), "Deleted ✓");
  const sync = () => run(async () => {
    if (!YT_KEY || !channelId) throw new Error("Set VITE_YOUTUBE_API_KEY in .env and the YouTube channel ID in General.");
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=6&type=video&key=${YT_KEY}`);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    for (const it of j.items) {
      const id = it.id.videoId;
      await setDoc(doc(db, "videos", `yt_${id}`), { title: decode(it.snippet.title), url: `https://www.youtube.com/watch?v=${id}`, thumbnail: it.snippet.thumbnails.high.url, date: it.snippet.publishedAt.slice(0, 10), createdAt: Date.now() }, { merge: true });
    }
  }, "Synced latest videos ✓");

  return (
    <div className="panel">
      <form onSubmit={submit}>
        <h3 className="display">{editId ? `Edit ${label}` : `Add ${label}`}</h3>
        {fields.map((f) => (
          <label key={f.k}>{f.l}
            {f.options ? (
              <select value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
            ) : (
              <input type={f.type || "text"} required={f.req} value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
            )}
          </label>
        ))}
        <button className="btn gold sm">{editId ? "Save changes" : `Add ${label}`}</button>{" "}
        {editId && <button type="button" className="btn dark sm" onClick={reset}>Cancel</button>}{" "}
        {col === "videos" && <button type="button" className="btn red sm" onClick={sync}>Sync from YouTube</button>} <Status st={st} />
      </form>
      <hr />
      {loading && <Loading text="Loading…" />}
      {error && <ErrorBox>{error}</ErrorBox>}
      {!loading && !error && data.length === 0 && <p className="empty">Nothing here yet.</p>}
      {data.map((it) => (
        <div className="item" key={it.id}>
          <span>{summary(it)}</span>
          <button className="mini" onClick={() => { const { id, createdAt, ...rest } = it; setForm({ ...blank, ...rest }); setEditId(id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
          <button className="mini danger" onClick={() => del(it.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

const TABS = ["General", "Socials", "Videos", "Giveaways", "Achievements", "Announcement"];

function Dashboard({ user }) {
  const { data: s, loading, error } = useSite();
  const [tab, setTab] = useState("General");
  if (loading) return <Loading />;
  return (
    <main className="wrap admin">
      <div className="between">
        <h1 className="display outline sm">Admin Dashboard</h1>
        <div><Link to="/" className="btn dark sm">View site</Link> <button className="btn red sm" onClick={() => signOut(auth)}>Sign out</button></div>
      </div>
      <small>Signed in as {user.email}</small>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "General" && <General s={s} />}
      {tab === "Socials" && <ListEditor s={s} field="socials" fixed cols={[{ k: "label", p: "Label" }, { k: "handle", p: "Handle" }, { k: "blurb", p: "Short text" }, { k: "url", p: "https://…", type: "url" }]} />}
      {tab === "Achievements" && <ListEditor s={s} field="achievements" blank={{ target: 0, label: "" }} cols={[{ k: "target", p: "Subscribers needed", type: "number" }, { k: "label", p: "Badge label (e.g. 1K)" }]} />}
      {tab === "Announcement" && <Announcement s={s} />}
      {tab === "Videos" && <Crud col="videos" order="date" label="video" channelId={s.youtubeChannelId} blank={{ title: "", url: "", thumbnail: "", date: "" }}
        fields={[{ k: "title", l: "Title", req: true }, { k: "url", l: "YouTube link", type: "url", req: true }, { k: "thumbnail", l: "Custom thumbnail URL (optional)" }, { k: "date", l: "Upload date", type: "date" }]}
        summary={(v) => `${v.title} (${v.date || "no date"})`} />}
      {tab === "Giveaways" && <Crud col="giveaways" order="createdAt" label="giveaway" blank={{ title: "", prize: "", status: "active", link: "", winner: "", when: "" }}
        fields={[{ k: "title", l: "Title", req: true }, { k: "prize", l: "Prize" }, { k: "status", l: "Status", options: ["active", "upcoming", "previous"] }, { k: "link", l: "Entry link (blank = Discord)", type: "url" }, { k: "winner", l: "Winner (for previous)" }, { k: "when", l: "Date / note" }]}
        summary={(g) => `${g.title} [${g.status}]${g.winner ? ` – ${g.winner}` : ""}`} />}
    </main>
  );
}

export default function Admin() {
  const [user, setUser] = useState(configured ? undefined : null);
  useEffect(() => (configured ? onAuthStateChanged(auth, setUser) : undefined), []);
  if (!configured) return <main className="wrap legal"><ErrorBox>Firebase isn't configured. Add your keys to <code>.env</code> and restart.</ErrorBox></main>;
  if (user === undefined) return <Loading text="Checking sign-in…" />;
  if (!user) return <Login />;
  if (!ADMIN_EMAIL || user.email.toLowerCase() !== ADMIN_EMAIL)
    return (
      <main className="wrap legal"><div className="panel">
        <ErrorBox>{ADMIN_EMAIL ? "This account isn't authorized as admin." : "Set VITE_ADMIN_EMAIL in .env to enable the dashboard."}</ErrorBox>
        <button className="btn dark" onClick={() => signOut(auth)}>Sign out</button>
      </div></main>
    );
  return <Dashboard user={user} />;
}
