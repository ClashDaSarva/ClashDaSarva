import { FaCrown } from "react-icons/fa6";

export const Loading = ({ text = "Loading…" }) => (
  <div className="center"><div className="spin" /><p>{text}</p></div>
);
export const ErrorBox = ({ children }) => <div className="err" role="alert">{children}</div>;
export const Logo = ({ s, size = 40 }) =>
  s.logoUrl ? <img src={s.logoUrl} alt="" width={size} height={size} className="logo-img" /> : <FaCrown size={size} color="#ffc41f" />;
