import { Link, useParams } from "react-router-dom";

const TEXT = {
  privacy: ["Privacy Policy", "This site stores no personal data about visitors. Links to YouTube, Instagram, Twitch, X and Discord open those services, which have their own privacy policies."],
  disclaimer: ["Disclaimer", "This is an unofficial fan content site. Clash of Clans is a trademark of Supercell. This site is not affiliated with, endorsed or sponsored by Supercell."],
};

export default function Legal() {
  const { kind } = useParams();
  const [title, body] = TEXT[kind] || ["Page not found", "That page does not exist."];
  return (
    <main className="wrap legal">
      <div className="panel">
        <h1 className="display outline sm">{title}</h1>
        <p>{body}</p>
        <Link to="/" className="btn gold">Back to home</Link>
      </div>
    </main>
  );
}
