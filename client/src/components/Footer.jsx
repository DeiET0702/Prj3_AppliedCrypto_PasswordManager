import { Link } from "react-router-dom";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-title">Password Manager</span>
        </div>

        <div className="footer-right">
          <p>© {new Date().getFullYear()} Team. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}