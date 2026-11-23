import { useState } from "react";
import { Link } from "react-router-dom";
import { FaYoutube, FaInstagram, FaTwitch, FaXTwitter, FaDiscord, FaUsers, FaShieldHalved, FaStar, FaCrown, FaTrophy, FaGift, FaCalendarDays, FaPlay, FaBars, FaXmark, FaChevronRight, FaLock } from "react-icons/fa6";
import { useSite, useCol, ytId, timeAgo } from "../data";
import { Loading, ErrorBox, Logo } from "../components/ui";

const ICONS = { youtube: FaYoutube, instagram: FaInstagram, twitch: FaTwitch, x: FaXTwitter, discord: FaDiscord };
const COLORS = { youtube: "#e8281f", instagram: "#d6249f", twitch: "#7c3aed", x: "#111827", discord: "#4f6bf0" };
const NAV = [["Home", "top"], ["Videos", "videos"], ["Giveaways", "giveaways"], ["Community", "community"], ["About", "about"]];

const Ext = ({ href, className, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>
);

export default function Home() {
  const { data: s, loading, error } = useSite();
  const videos = useCol("videos", "date");
  const gws = useCol("giveaways", "createdAt");
  const [open, setOpen] = useState(false);
  if (loading) return <Loading text="Loading ClashDaSarva…" />;

  const url = (id) => s.socials.find((x) => x.id === id)?.url || "#";
  const yt = url("youtube"), dc = url("discord");
  const active = gws.data.filter((g) => g.status === "active");
  const upcoming = gws.data.filter((g) => g.status === "upcoming");
  const prev = gws.data.filter((g) => g.status === "previous");
  const goals = [...s.achievements].sort((a, b) => a.target - b.target);
  const next = goals.find((g) => s.subscribers < g.target);
  const lastDone = [...goals].reverse().find((g) => s.subscribers >= g.target);
  const go = (id) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <div id="top">
      <header className="nav">
        <div className="wrap">
          <button className="brand" onClick={() => go("top")} aria-label="Home"><Logo s={s} /><span className="display">{s.name}</span></button>
          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <FaXmark /> : <FaBars />}</button>
          <nav className={open ? "links open" : "links"}>
            {NAV.map(([l, id]) => <button key={id} onClick={() => go(id)}>{l}</button>)}
            <Ext href={dc} className="btn blue sm"><FaDiscord /> Join Community</Ext>
          </nav>
        </div>
      </header>

      {s.announcement && <div className="announce"><FaStar /> {s.announcement}</div>}
      <main className="wrap">
        {error === "not-configured" && <ErrorBox>Firebase isn't configured yet, so default content is shown. Add your keys to <code>.env</code> (see README).</ErrorBox>}
        {error && error !== "not-configured" && <ErrorBox>Couldn't load live site data: {error}</ErrorBox>}

        <section className="hero" id="about">
          <div className="avatar">{s.profileUrl ? <img src={s.profileUrl} alt={`${s.name} profile`} /> : <FaCrown size={54} color="#ffc41f" />}</div>
          <h1 className="display outline">{s.name}</h1>
          <p className="tag display">— {s.tagline} —</p>
          <p className="intro">{s.description}</p>
          <div className="cta">
            <Ext href={yt} className="btn red"><FaYoutube size={24} /> Subscribe</Ext>
            <Ext href={dc} className="btn blue"><FaDiscord size={24} /> Join Discord</Ext>
          </div>
          <div className="stats">
            <div><FaUsers size={28} /><b>{Number(s.subscribers).toLocaleString()}+</b><span>Subscribers</span></div>
            <div><FaShieldHalved size={28} /><b>Clash of Clans</b><span>Content</span></div>
            <div><FaStar size={28} /><b>Growing</b><span>Community</span></div>
          </div>
        </section>

        <section>
          <h2 className="display h2"><FaCrown color="#ffc41f" /> Follow Me</h2>
          <div className="stack">
            {s.socials.map((x) => {
              const I = ICONS[x.id] || FaStar;
              return (
                <Ext key={x.id} href={x.url} className="social">
                  <span className="ico" style={{ background: COLORS[x.id] || "#334155" }}><I size={26} color="#fff" /></span>
                  <span className="txt"><b>{x.label}</b><small>{[x.handle, x.blurb].filter(Boolean).join(" – ")}</small></span>
                  <FaChevronRight />
                </Ext>
              );
            })}
          </div>
        </section>

        <section id="videos">
          <div className="between">
            <h2 className="display h2"><FaPlay color="#ffc41f" /> Latest Videos</h2>
            <Ext href={yt} className="btn dark sm">View All <FaChevronRight /></Ext>
          </div>
          {videos.loading && <Loading text="Loading videos…" />}
          {videos.error && <ErrorBox>Couldn't load videos: {videos.error}</ErrorBox>}
          {!videos.loading && !videos.error && videos.data.length === 0 && <p className="empty">No videos added yet. Check back soon!</p>}
          <div className="grid">
            {videos.data.slice(0, 6).map((v) => (
              <Ext key={v.id} href={v.url} className="vid">
                <img loading="lazy" alt="" src={v.thumbnail || `https://i.ytimg.com/vi/${ytId(v.url)}/hqdefault.jpg`} />
                <div><b>{v.title}</b><small><FaYoutube color="#e8281f" /> {timeAgo(v.date)}</small></div>
              </Ext>
            ))}
          </div>
        </section>

        <section>
          <h2 className="display h2"><FaTrophy color="#ffc41f" /> Achievements</h2>
          <div className="ach">
            {goals.map((g) => (
              <div key={g.target} className={s.subscribers >= g.target ? (g === lastDone ? "done now" : "done") : ""}>
                <FaCrown /><b>{g.label}</b><span>Subscribers</span>
              </div>
            ))}
          </div>
          {next && <p className="goal">Next goal: {next.target.toLocaleString()} subscribers · {(next.target - s.subscribers).toLocaleString()} to go</p>}
        </section>

        <section id="giveaways">
          <h2 className="display h2"><FaGift color="#ffc41f" /> Giveaways &amp; Events</h2>
          {gws.loading && <Loading text="Loading giveaways…" />}
          {gws.error && <ErrorBox>Couldn't load giveaways: {gws.error}</ErrorBox>}
          <div className="two">
            <div className="gv">
              <FaGift size={40} />
              {active[0] ? (<div><b className="display">Active Giveaway!</b><p>{active[0].title}{active[0].prize ? ` – ${active[0].prize}` : ""}</p>{active[0].when && <small>{active[0].when}</small>}</div>)
                : (<div><b className="display">No active giveaway</b><p>Join the Discord to hear about the next one.</p></div>)}
              <Ext href={active[0]?.link || dc} className="btn gold sm">Join Now <FaChevronRight /></Ext>
            </div>
            <div className="gv ev">
              <FaCalendarDays size={36} />
              <div><small>Next Event</small><b className="display">{upcoming[0]?.title || "Coming soon…"}</b>{upcoming[0]?.when && <small>{upcoming[0].when}</small>}</div>
            </div>
          </div>
          {prev.length > 0 && (
            <div className="prev">
              <h3 className="display">Previous giveaways &amp; winners</h3>
              {prev.map((g) => <p key={g.id}><FaTrophy color="#ffc41f" /> <b>{g.title}</b> – {g.winner ? `Winner: ${g.winner}` : "Winner to be announced"}</p>)}
            </div>
          )}
        </section>

        <section id="community">
          <div className="discord">
            <FaDiscord size={48} />
            <div><b className="display">Join Our Discord Server</b><small>Be a part of the {s.name} community!</small></div>
            <Ext href={dc} className="btn gold sm">Join Now <FaChevronRight /></Ext>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="brand"><Logo s={s} /><div><b className="display">{s.name}</b><small>{s.tagline}</small></div></div>
          <div className="icons">
            {s.socials.map((x) => { const I = ICONS[x.id] || FaStar; return <Ext key={x.id} href={x.url} className="fi" ><span style={{ background: COLORS[x.id] }} aria-label={x.label}><I color="#fff" /></span></Ext>; })}
          </div>
          <div className="legal">
            <a href={s.contactEmail ? `mailto:${s.contactEmail}` : dc} target="_blank" rel="noreferrer">Contact</a> | <Link to="/legal/privacy">Privacy Policy</Link> | <Link to="/legal/disclaimer">Disclaimer</Link>
            <small>© {new Date().getFullYear()} {s.name}. All Rights Reserved. <Link to="/admin" aria-label="Admin"><FaLock size={10} /></Link></small>
          </div>
        </div>
      </footer>
    </div>
  );
}
