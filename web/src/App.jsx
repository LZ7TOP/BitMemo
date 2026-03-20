import React, { useState } from "react";
import {
  Download,
  Languages,
  MousePointer2,
  Zap,
  Layout,
  Github,
  Globe,
  ArrowLeft,
  Puzzle,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, LanguageProvider } from "./i18n";

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <motion.div whileHover={{ y: -10, scale: 1.02 }} className="pixel-box">
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          background: "var(--primary)",
          padding: "10px",
          border: "3px solid #000",
          boxShadow: "4px 4px 0px rgba(0,0,0,0.2)",
        }}
      >
        <Icon size={24} color="#000" />
      </div>
      <h3
        className="pixel-font"
        style={{ fontSize: "0.9rem", letterSpacing: "-1px" }}
      >
        {title}
      </h3>
    </div>
    <p
      style={{
        color: "var(--text-dim)",
        fontSize: "0.9rem",
        lineHeight: "1.8",
      }}
    >
      {desc}
    </p>
  </motion.div>
);

const LanguageSelector = () => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const langs = [
    { code: "zh", name: "简体中文" },
    { code: "zh_tw", name: "繁體中文" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
  ];

  const currentLangName = langs.find((l) => l.code === lang)?.name || "ZH";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pixel-btn"
        style={{
          fontSize: "10px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "120px",
          justifyContent: "center",
        }}
      >
        <Globe size={14} /> {currentLangName}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pixel-box"
            style={{
              position: "absolute",
              top: "120%",
              right: 0,
              zIndex: 1000,
              padding: "4px",
              minWidth: "150px",
            }}
          >
            {langs.map((l) => (
              <div
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  color: lang === l.code ? "var(--primary)" : "white",
                  fontSize: "12px",
                  background:
                    lang === l.code ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                {l.name}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function HomeView({ setView }) {
  const { t } = useTranslation();
  const versions =
    typeof __APP_CHANGELOG__ !== "undefined" ? __APP_CHANGELOG__ : [];

  return (
    <>
      {/* Hero */}
      <section
        className="container"
        style={{ padding: "120px 0", textAlign: "center" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="pixel-font"
            style={{
              fontSize: "2.8rem",
              marginBottom: "32px",
              lineHeight: "1.3",
              letterSpacing: "-3px",
            }}
          >
            {t("hero_title").split("<1>")[0]}
            <span
              style={{
                color: "var(--primary)",
                textShadow: "6px 6px 0px #000",
                display: "inline-block",
                margin: "0 10px",
              }}
            >
              {t("hero_title").includes("<1>")
                ? t("hero_title").split("<1>")[1].split("</1>")[0]
                : "8-BIT"}
            </span>
            {t("hero_title").split("</1>")[1] || ""}
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-dim)",
              maxWidth: "850px",
              margin: "0 auto 56px",
              lineHeight: "2",
            }}
          >
            {t("hero_subtitle")}
          </p>
          <div
            style={{
              display: "flex",
              gap: "24px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://github.com/LZ7TOP/BitMemo/releases/latest"
              className="pixel-btn"
              style={{ fontSize: "18px", padding: "16px 32px" }}
            >
              {t("btn_download")} (v{__APP_VERSION__})
            </a>
            <button
              onClick={() => setView("tutorial")}
              className="pixel-btn secondary"
              style={{ fontSize: "18px", padding: "16px 32px" }}
            >
              {t("btn_guide")}
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container" style={{ padding: "80px 0" }}>
        <h2
          className="pixel-font"
          style={{
            textAlign: "center",
            marginBottom: "70px",
            fontSize: "1.4rem",
            color: "var(--secondary)",
          }}
        >
          {t("features_title")}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "40px",
          }}
        >
          <FeatureCard
            icon={Languages}
            title={t("feature_i18n_title")}
            desc={t("feature_i18n_desc")}
          />
          <FeatureCard
            icon={MousePointer2}
            title={t("feature_capture_title")}
            desc={t("feature_capture_desc")}
          />
          <FeatureCard
            icon={Zap}
            title={t("feature_smart_title")}
            desc={t("feature_smart_desc")}
          />
          <FeatureCard
            icon={Layout}
            title={t("feature_sync_title")}
            desc={t("feature_sync_desc")}
          />
        </div>
      </section>

      {/* Showcase */}
      <section className="container" style={{ padding: "80px 0" }}>
        <h2
          className="pixel-font"
          style={{
            textAlign: "center",
            marginBottom: "70px",
            fontSize: "1.4rem",
          }}
        >
          {t("showcase_title")}
        </h2>
        <div className="gallery">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="gallery-item pixel-box"
          >
            <img src="/img/1-主页面.png" alt="Main Interface" />
            <p
              className="pixel-font"
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "11px",
                color: "var(--primary)",
              }}
            >
              {t("showcase_dashboard")}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="gallery-item pixel-box"
          >
            <img src="/img/6-1右键添加.png" alt="Smart Context Menu" />
            <p
              className="pixel-font"
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "11px",
                color: "var(--secondary)",
              }}
            >
              {t("showcase_context")}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="gallery-item pixel-box"
          >
            <img src="/img/5-多语言.png" alt="Multi Language Support" />
            <p
              className="pixel-font"
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "11px",
              }}
            >
              {t("showcase_engine")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Download & History */}
      <section className="container" style={{ padding: "80px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "50px",
          }}
        >
          {/* Version History */}
          <div className="pixel-box">
            <h2
              className="pixel-font"
              style={{
                fontSize: "1.2rem",
                marginBottom: "40px",
                color: "var(--primary)",
              }}
            >
              {t("history_title")}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "30px" }}
            >
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  style={{
                    paddingBottom: "20px",
                    borderBottom:
                      i < versions.length - 1
                        ? "2px dashed rgba(255,255,255,0.1)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className="pixel-font"
                      style={{ fontSize: "14px", color: "var(--text)" }}
                    >
                      v{v.version}
                    </span>
                    {i === 0 && (
                      <span
                        className="pixel-font"
                        style={{ fontSize: "8px", color: "var(--primary)" }}
                      >
                        [{t("ver_latest")}]
                      </span>
                    )}
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {v.bullets.map((b, bi) => (
                      <li
                        key={bi}
                        style={{
                          fontSize: "13px",
                          color: "var(--text-dim)",
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <span style={{ color: "var(--primary)" }}>&gt;</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <a
              href="https://github.com/LZ7TOP/BitMemo/blob/main/CHANGELOG.md"
              style={{
                display: "block",
                marginTop: "30px",
                fontSize: "12px",
                color: "var(--primary)",
                textDecoration: "underline",
              }}
            >
              View Full Changelog on GitHub
            </a>
          </div>

          {/* Download Center */}
          <div
            className="pixel-box"
            style={{ background: "rgba(74, 116, 222, 0.05)" }}
          >
            <h2
              className="pixel-font"
              style={{
                fontSize: "1.2rem",
                marginBottom: "40px",
                color: "var(--accent)",
              }}
            >
              {t("download_title")}
            </h2>
            <p
              style={{
                marginBottom: "40px",
                fontSize: "14px",
                color: "var(--text-dim)",
                lineHeight: "1.8",
              }}
            >
              获取最新的 BitMemo 离线安装包。支持 Chrome、Edge 等所有主流
              Chromium 浏览器。
            </p>
            <a
              href={`https://github.com/LZ7TOP/BitMemo/releases/download/v${__APP_VERSION__}/BitMemo-v${__APP_VERSION__}.zip`}
              className="pixel-btn"
              style={{ width: "100%", marginBottom: "24px" }}
            >
              <Download size={20} /> {t("btn_download_now")}
            </a>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                textAlign: "center",
                opacity: 0.5,
              }}
            >
              SECURED BY GITHUB RELEASES
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function TutorialView({ setView }) {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Download,
      title: t("tutorial_step_1_title"),
      desc: t("tutorial_step_1_desc"),
    },
    {
      icon: Puzzle,
      title: t("tutorial_step_2_title"),
      desc: t("tutorial_step_2_desc"),
    },
    {
      icon: MousePointer2,
      title: t("tutorial_step_3_title"),
      desc: t("tutorial_step_3_desc"),
    },
    {
      icon: Settings,
      title: t("tutorial_step_4_title"),
      desc: t("tutorial_step_4_desc"),
    },
  ];

  return (
    <section className="container" style={{ padding: "80px 0" }}>
      <button
        onClick={() => setView("home")}
        className="pixel-btn"
        style={{ marginBottom: "60px", fontSize: "12px" }}
      >
        <ArrowLeft size={16} /> {t("btn_back")}
      </button>

      <h2
        className="pixel-font"
        style={{
          textAlign: "center",
          marginBottom: "80px",
          fontSize: "2rem",
          color: "var(--primary)",
        }}
      >
        {t("tutorial_title")}
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "60px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="pixel-box"
            style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}
          >
            <div
              style={{
                background: "var(--bg)",
                padding: "20px",
                border: "4px solid var(--primary)",
                boxShadow: "6px 6px 0px var(--primary)",
                flexShrink: 0,
              }}
            >
              <step.icon size={40} color="var(--primary)" />
            </div>
            <div>
              <h3
                className="pixel-font"
                style={{ fontSize: "1.2rem", marginBottom: "16px" }}
              >
                {step.title}
              </h3>
              <p style={{ color: "var(--text-dim)", lineHeight: "1.8" }}>
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Main() {
  const { t } = useTranslation();
  const [view, setView] = useState("home");

  return (
    <div className="min-h-screen">
      <div className="bg-grid" />

      {/* Header */}
      <nav
        className="container"
        style={{
          padding: "30px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          onClick={() => setView("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            cursor: "pointer",
          }}
        >
          <img
            src="/icons/icon48.png"
            className="animate-float"
            alt="Logo"
            width="40"
            height="40"
          />
          <span
            className="pixel-font"
            style={{
              fontSize: "22px",
              color: "var(--primary)",
              textShadow: "3px 3px 0px #000",
            }}
          >
            BitMemo
          </span>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <LanguageSelector />
          <a
            href="https://github.com/LZ7TOP/BitMemo"
            className="pixel-btn secondary"
            style={{
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Github size={14} /> {t("nav_github")}
          </a>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: view === "home" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: view === "home" ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === "home" ? (
            <HomeView setView={setView} />
          ) : (
            <TutorialView setView={setView} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer
        className="container"
        style={{ padding: "120px 0 60px", textAlign: "center" }}
      >
        <div
          style={{
            borderTop: "4px solid #000",
            paddingTop: "60px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--bg)",
              padding: "0 20px",
            }}
          >
            <img src="/icons/icon16.png" alt="pixel-heart" />
          </div>
          <p
            className="pixel-font"
            style={{ fontSize: "12px", marginBottom: "15px" }}
          >
            {t("footer_crafted")}
          </p>
          <p className="pixel-font" style={{ fontSize: "9px", opacity: 0.5 }}>
            {t("footer_version").replace("{{version}}", __APP_VERSION__)}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Main />
    </LanguageProvider>
  );
}
