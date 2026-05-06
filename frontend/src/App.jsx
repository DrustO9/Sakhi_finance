import { useState, createContext, useContext } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { STR } from "./i18n/strings";
import Home from "./pages/Home.jsx";
import Applicant from "./pages/Applicant.jsx";
import UpiUpload from "./pages/UpiUpload.jsx";
import Psychometric from "./pages/Psychometric.jsx";
import Result from "./pages/Result.jsx";
import Admin from "./pages/Admin.jsx";

export const AppCtx = createContext(null);

export default function App() {
  const [lang, setLang] = useState("en");
  const [flow, setFlow] = useState({
    name: "",
    age: 30,
    dependents: 1,
    upiFeatures: null,
    psychResponses: [],
    result: null,
  });

  const t = STR[lang];

  return (
    <AppCtx.Provider value={{ lang, setLang, flow, setFlow, t }}>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <h1>
              <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                {t.appTitle}
              </Link>
            </h1>
            <div className="tagline">{t.tagline}</div>
          </div>
          <div className="lang-toggle">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")}>हिं</button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/applicant" element={<Applicant />} />
            <Route path="/upi" element={<UpiUpload />} />
            <Route path="/test" element={<Psychometric />} />
            <Route path="/result" element={<Result />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/:id" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
