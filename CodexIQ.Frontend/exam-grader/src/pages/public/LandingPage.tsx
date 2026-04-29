import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { GlobalOutlined } from '@ant-design/icons';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  ControlOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  MessageOutlined,
  ScanOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useAppStore } from "../../store/useAppStore";
import HeaderActions from "../../components/HeaderActions";
import "./landing.css";

type Lang = "tr" | "en";

const copy: Record<
  Lang,
  {
    nav: { how: string; features: string; preview: string; contact: string };
    login: string;
    eyebrow: string;
    heroTitle: [string, string, string];
    heroSub: string;
    learnMore: string;
    stats: Array<{ value: string; label: string }>;
    meta: Array<{ value: string; label: string }>;
    how: {
      eyebrow: string;
      title: string;
      sub: string;
      steps: Array<{
        key: string;
        keyLabel: string;
        title: string;
        desc: string;
        detail?: string;
      }>;
    };
    features: {
      eyebrow: string;
      title: string;
      sub: string;
      items: Array<{ title: string; desc: string }>;
    };
    preview: {
      eyebrow: string;
      title: string;
      sub: string;
      appPath: string;
      sideNav: {
        dashboard: string;
        results: string;
        upload: string;
        students: string;
        messages: string;
        profile: string;
      };
      crumbs: { results: string; exam: string; file: string };
      heading: string;
      studentMeta: string;
      status: string;
      totalScore: string;
      grade: string;
      ensembleTitle: string;
      weightedVote: string;
    };
    roles: {
      eyebrow: string;
      title: string;
      sub: string;
      items: Array<{
        tag: string;
        title: string;
        desc: string;
        bullets: string[];
      }>;
    };
    terminal: { line1: string; line2: string; final: string };
    cta: { title: string; sub: string; contact: string };
    footer: {
      tag: string;
      product: string;
      company: string;
      resources: string;
      rights: string;
      uiPreview: string;
      workflow: string;
    };
  }
> = {
  tr: {
    nav: {
      how: "Nasil Calisir",
      features: "Ozellikler",
      preview: "Onizleme",
      contact: "Iletisim",
    },
    login: "Giris Yap",
    eyebrow: "Ensemble AI aktif",
    heroTitle: [
      "Programlama sinavlari icin",
      "yapay zeka destekli",
      "degerlendirme",
    ],
    heroSub:
      "CodexIQ el yazisi kod kagitlarini OCR ile okur, birden fazla AI modeliyle paralel degerlendirir ve ogrenciye satir bazli geri bildirim sunar.",
    learnMore: "Detaylari Gor",
    stats: [
      { value: "12,400+", label: "kagit islendi" },
      { value: "250+", label: "aktif ogretmen" },
      { value: "~45 sn", label: "ortalama degerlendirme" },
      { value: "5 dil", label: "desteklenen dil" },
    ],
    meta: [
      { value: "45 sn", label: "ortalama sure / kagit" },
      { value: "3 model", label: "AI degerlendirici" },
      { value: "%98.4", label: "OCR dogruluk" },
    ],
    how: {
      eyebrow: "NASIL CALISIR",
      title: "Uc adimda otomatik degerlendirme",
      sub: "Kagitlari yukleyin, kalan akis sistem tarafinda ilerlesin.",
      steps: [
        {
          key: "upload",
          keyLabel: "step.upload",
          title: "Kagitlari yukleyin",
          desc: "PDF veya JPG formatında elle yazılmış kod kağıtlarını sürükleyip bırakın. Toplu yüklemeleri destekler.",
          detail: "$ codexiq upload --batch midterm-2026.pdf",
        },
        {
          key: "evaluate",
          keyLabel: "step.evaluate",
          title: "AI ensemble degerlendirir",
          desc: "Üç model paralel çalışır. OCR ile metin çözülür, sonuç ağırlıklı oylama ile birleştirilir.",
          detail: "",
        },
        {
          key: "deliver",
          keyLabel: "step.deliver",
          title: "Sonuclar teslim edilir",
          desc: "Öğretmen panelinden onayla. Öğrenci puan, satır bazlı hatalar ve önerileri görür.",
          detail: "12 kagit, 38 saniyede tamamlandi",
        },
      ],
    },
    features: {
      eyebrow: "OZELLIKLER",
      title: "Sinif hazir, muhendislik odakli",
      sub: "Mevcut rolleriniz ve mevcut backend akisinizle uyumlu bir calisma duzeni.",
      items: [
        { title: "Coklu AI Ensemble", desc: "Gemini 2.5 Flash, Groq Llama 3.3 ve Ollama Llama 3.1 birlikte karar verir." },
        { title: "El Yazisi OCR", desc: "Tarayıcıdan veya telefondan çekilen sınav kağıtlarını okur." },
        { title: "Ogretmen Override", desc: "AI puanını dilediğin gibi düzenle, notunu ekle, son sözü sen söyle." },
        { title: "Mesajlasma", desc: "Öğrenci ve öğretmen arasında platform içi direkt iletişim." },
        { title: "Detayli Analiz", desc: "Syntax ve mantık hatalarını satır satır işaretler, çözüm önerir." },
        { title: "TR / EN Arayuz", desc: "TR / EN arayüz, Python · C · C++ · Java · JavaScript desteği." },
      ],
    },
    preview: {
      eyebrow: "CANLI ORNEK",
      title: "Bir kagit nasil degerlendiriliyor?",
      sub: "Sistemdeki sonuc deneyimini landing icinde anlatan bir onizleme.",
      appPath: "app.codexiq.io / sonuclar / paper_07",
      sideNav: {
        dashboard: "Dashboard",
        results: "Sonuclar",
        upload: "Sinav Yukle",
        students: "Ogrenciler",
        messages: "Mesajlar",
        profile: "Profil",
      },
      crumbs: { results: "sonuclar", exam: "algoritmalar vize", file: "paper_07.jpg" },
      heading: "Algoritmalar Vize • Soru 2",
      studentMeta: "student: 20210456 • Bilgisayar Muhendisligi • python",
      status: "Onaylandi",
      totalScore: "TOPLAM PUAN",
      grade: "A • mukemmel",
      ensembleTitle: "AI ENSEMBLE • JURI DAGILIMI",
      weightedVote: "agirlikli oy",
    },
    roles: {
      eyebrow: "ROLE GORE",
      title: "Uc panel, tek platform",
      sub: "Ogrenci, ogretmen ve admin akislariniz ayni sistemde birlesiyor.",
      items: [
        {
          tag: "OGRENCI",
          title: "Anlik geri bildirim",
          desc: "Sonucu hizli gorur, hatalarini ve ogretmen notunu takip eder.",
          bullets: [
            "Puan ve siralama gorunumu",
            "Satir bazli hata raporu",
            "Gecmis sinav arsivi",
            "Ogretmenle mesajlasma",
          ],
        },
        {
          tag: "OGRETMEN",
          title: "Saatleri dakikalara indirir",
          desc: "Toplu yukleme, onay ve manuel duzeltme tek panelde.",
          bullets: [
            "Toplu kagit yukleme",
            "AI skor override",
            "Sinif ortalamasi ve grafikler",
            "Ogrenciye aciklama notu",
          ],
        },
        {
          tag: "ADMIN",
          title: "Tum resmi tek yerde gorur",
          desc: "Kullanici, sinif, kuyruk ve maliyet akislari ayni yonetim yuzeyinde.",
          bullets: [
            "Kullanici ve rol yonetimi",
            "Sinif ve ders organizasyonu",
            "Kuyruk ve log takibi",
            "API maliyet gorunurlugu",
          ],
        },
      ],
    },
    terminal: {
      line1: "OCR tamamlandi, 12 sayfa cozuldu, agirlikli puanlama baslatildi",
      line2: "modeller: gemini, groq, ollama",
      final: "nihai",
    },
    cta: {
      title: "CodexIQ'yu sisteminizin on kapisina tasiyin",
      sub: "Bu landing artik mevcut login ve panel akislarinizla ayni React uygulamasi icinde calisiyor.",
      contact: "Iletisime Gec",
    },
    footer: {
      tag: "Programlama egitiminde otomasyon. AI destekli, ogretmen kontrollu.",
      product: "Urun",
      company: "Sirket",
      resources: "Kaynaklar",
      uiPreview: "Arayuz Onizleme",
      workflow: "Is Akisi",
      rights: "© 2026 CodexIQ. Tum haklari saklidir.",
    },
  },
  en: {
    nav: {
      how: "How It Works",
      features: "Features",
      preview: "Preview",
      contact: "Contact",
    },
    login: "Sign In",
    eyebrow: "Ensemble AI online",
    heroTitle: [
      "AI-powered grading",
      "for programming",
      "exams",
    ],
    heroSub:
      "CodexIQ reads handwritten code papers with OCR, evaluates them across multiple AI models, and returns line-level feedback to students.",
    learnMore: "Explore More",
    stats: [
      { value: "12,400+", label: "papers processed" },
      { value: "250+", label: "active teachers" },
      { value: "~45 sec", label: "average grading" },
      { value: "5 langs", label: "supported languages" },
    ],
    meta: [
      { value: "45 sec", label: "average time / paper" },
      { value: "3 models", label: "AI graders" },
      { value: "98.4%", label: "OCR accuracy" },
    ],
    how: {
      eyebrow: "HOW IT WORKS",
      title: "Automated grading in three steps",
      sub: "Upload papers and let the rest of the workflow move through the system.",
      steps: [
        {
          key: "upload",
          keyLabel: "step.upload",
          title: "Upload papers",
          desc: "Add scanned or photographed papers in batch.",
          detail: "$ codexiq upload --batch midterm-2026.pdf",
        },
        {
          key: "evaluate",
          keyLabel: "step.evaluate",
          title: "AI ensemble evaluates",
          desc: "OCR, code analysis, and weighted voting run in one flow.",
          detail: "Gemini, Groq, and Ollama contribute together.",
        },
        {
          key: "deliver",
          keyLabel: "step.deliver",
          title: "Results are delivered",
          desc: "After teacher approval, students see scores, errors, and notes.",
          detail: "12 papers completed in 38 seconds",
        },
      ],
    },
    features: {
      eyebrow: "FEATURES",
      title: "Classroom-ready, engineering-minded",
      sub: "Aligned with your existing roles and backend workflows.",
      items: [
        { title: "Multi-AI Ensemble", desc: "Combines outputs from multiple grading models." },
        { title: "Handwriting OCR", desc: "Supports scans and phone photo workflows." },
        { title: "Teacher Override", desc: "Teachers can adjust AI scores and add notes." },
        { title: "Messaging", desc: "Students and teachers communicate in the platform." },
        { title: "Detailed Analysis", desc: "Syntax and logic issues are marked line by line." },
        { title: "TR / EN UI", desc: "Switch language without leaving the app." },
      ],
    },
    preview: {
      eyebrow: "LIVE PREVIEW",
      title: "How does one paper get graded?",
      sub: "A landing-page preview of the result experience already present in the system.",
      appPath: "app.codexiq.io / results / paper_07",
      sideNav: {
        dashboard: "Dashboard",
        results: "Results",
        upload: "Upload Exam",
        students: "Students",
        messages: "Messages",
        profile: "Profile",
      },
      crumbs: { results: "results", exam: "algorithms midterm", file: "paper_07.jpg" },
      heading: "Algorithms Midterm • Question 2",
      studentMeta: "student: 20210456 • Computer Engineering • python",
      status: "Approved",
      totalScore: "TOTAL SCORE",
      grade: "A • excellent",
      ensembleTitle: "AI ENSEMBLE • JUDGE BREAKDOWN",
      weightedVote: "weighted vote",
    },
    roles: {
      eyebrow: "BY ROLE",
      title: "Three panels, one platform",
      sub: "Student, teacher, and admin workflows live inside one product.",
      items: [
        {
          tag: "STUDENT",
          title: "Instant feedback",
          desc: "See the result quickly and review teacher notes and mistakes.",
          bullets: [
            "Score and ranking view",
            "Line-level error report",
            "Past exam archive",
            "Teacher messaging",
          ],
        },
        {
          tag: "TEACHER",
          title: "Turns hours into minutes",
          desc: "Batch upload, approval, and manual correction in one panel.",
          bullets: [
            "Bulk paper upload",
            "AI score override",
            "Class averages and charts",
            "Student-facing notes",
          ],
        },
        {
          tag: "ADMIN",
          title: "See the whole operation",
          desc: "Users, classes, queues, and costs in one management layer.",
          bullets: [
            "User and role management",
            "Class and course organization",
            "Queue and log tracking",
            "API cost visibility",
          ],
        },
      ],
    },
    terminal: {
      line1: "OCR complete, 12 pages parsed, weighted scoring initialized",
      line2: "models: gemini, groq, ollama",
      final: "final",
    },
    cta: {
      title: "Bring CodexIQ to the front door of your system",
      sub: "This landing page now runs inside the same React app as your login and dashboards.",
      contact: "Contact",
    },
    footer: {
      tag: "Automation for programming education. AI-powered, teacher-controlled.",
      product: "Product",
      company: "Company",
      resources: "Resources",
      uiPreview: "UI Preview",
      workflow: "Workflow",
      rights: "© 2026 CodexIQ. All rights reserved.",
    },
  },
};

const featureIcons = [
  <ControlOutlined />,
  <ScanOutlined />,
  <CheckCircleOutlined />,
  <MessageOutlined />,
  <LineChartOutlined />,
  <GlobalOutlined />,
];

const stepIcons = [<UploadOutlined />, <ControlOutlined />, <CheckCircleOutlined />];

let activeScrollAnimation = 0;

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const start = window.scrollY;
  const target = Math.max(0, element.getBoundingClientRect().top + window.scrollY - 88);
  const distance = target - start;
  const duration = 900;
  const startTime = performance.now();

  if (activeScrollAnimation) {
    window.cancelAnimationFrame(activeScrollAnimation);
  }

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo(0, start + distance * eased);

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(tick);
      return;
    }

    window.history.replaceState(null, "", `#${id}`);
    activeScrollAnimation = 0;
  };

  activeScrollAnimation = window.requestAnimationFrame(tick);
}

function CodeRain() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const chars = "01{}<>()=>+-*/[];:,.|&!?#$%";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let columns: Array<{ y: number; speed: number; char: string; bright: boolean }> = [];

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const fontSize = 14 * dpr;
      const count = Math.floor(canvas.width / fontSize);

      columns = Array.from({ length: count }, () => ({
        y: Math.random() * canvas.height,
        speed: (0.4 + Math.random() * 0.7) * dpr,
        char: chars[Math.floor(Math.random() * chars.length)],
        bright: Math.random() < 0.05,
      }));

      context.font = `${fontSize}px "JetBrains Mono", monospace`;
    };

    const tick = () => {
      const isLight = theme === "light";
      context.fillStyle = isLight ? "rgba(246,248,252,0.1)" : "rgba(10,14,26,0.1)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const fontSize = 14 * dpr;
      columns.forEach((column, index) => {
        const x = index * fontSize;
        column.y += column.speed;

        if (column.y > canvas.height + 40) {
          column.y = -20;
          column.char = chars[Math.floor(Math.random() * chars.length)];
          column.bright = Math.random() < 0.05;
        }

        if (Math.random() < 0.04) {
          column.char = chars[Math.floor(Math.random() * chars.length)];
        }

        context.fillStyle = column.bright
          ? isLight
            ? "rgba(0,184,212,0.55)"
            : "rgba(0,229,255,0.85)"
          : isLight
            ? "rgba(0,184,212,0.18)"
            : "rgba(0,229,255,0.22)";

        context.fillText(column.char, x, column.y);
      });

      frame = window.requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return <canvas ref={ref} className="landing-code-rain" aria-hidden="true" />;
}

function LandingPage() {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated());
  const user = useAppStore((state) => state.user);

  const target = useMemo(() => {
    if (!isAuthenticated || !user?.role) {
      return null;
    }

    switch (user.role) {
      case "Admin":
        return "/admin";
      case "Teacher":
        return "/teacher";
      case "Student":
        return "/student";
      default:
        return "/login";
    }
  }, [isAuthenticated, user]);

  const t = copy[language];
  const handleSectionNav =
    (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      scrollToSection(id);
    };

  return (
    <div className="landing-page" data-theme={theme}>
      <div className="landing-page-bg" />
      <CodeRain />

      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <a href="#top" className="landing-logo">
            <span className="landing-logo-mark">
              <CodeOutlined />
            </span>
            <span>
              Codex<span className="landing-logo-accent">IQ</span>
            </span>
          </a>

          <nav className="landing-nav">
            <a href="#how" onClick={handleSectionNav("how")}>{t.nav.how}</a>
            <a href="#features" onClick={handleSectionNav("features")}>{t.nav.features}</a>
            <a href="#preview" onClick={handleSectionNav("preview")}>{t.nav.preview}</a>
            <a href="#contact" onClick={handleSectionNav("contact")}>{t.nav.contact}</a>
          </nav>

          <div className="landing-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <HeaderActions />
            <Link to={target ?? "/login"} className="landing-primary-link">
              {t.login}
              <ArrowRightOutlined />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div>
              <span className="landing-eyebrow">
                <span className="landing-dot" />
                {t.eyebrow}
              </span>
              <h1 className="landing-hero-title">
                {t.heroTitle[0]}
                <br />
                <span className="landing-hero-accent">{t.heroTitle[1]}</span>
                <br />
                {t.heroTitle[2]}
                <span className="landing-hero-caret" aria-hidden="true" />
              </h1>
              <p className="landing-hero-sub">{t.heroSub}</p>
              <div className="landing-hero-actions">
                <Link to={target ?? "/login"} className="landing-primary-link landing-primary-link-lg">
                  {t.login}
                  <ArrowRightOutlined />
                </Link>
                <a
                  href="#how"
                  onClick={handleSectionNav("how")}
                  className="landing-ghost-link landing-primary-link-lg"
                >
                  {t.learnMore}
                </a>
              </div>
              <div className="landing-meta">
                {t.meta.map((item) => (
                  <span key={item.label}>
                    <b>{item.value}</b> {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing-terminal">
              <div className="landing-terminal-bar">
                <div className="landing-terminal-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span className="landing-terminal-title">codexiq.grading.session</span>
                <span className="landing-terminal-tag">live</span>
              </div>
              <div className="landing-terminal-body">
                <div className="landing-terminal-line">
                  <span className="prompt">$</span>
                  <span>
                    codexiq grade <span className="token-string">"midterm-2026.pdf"</span> --ensemble
                  </span>
                </div>
                <div className="landing-terminal-line landing-muted">
                  {t.terminal.line1}
                </div>
                <div className="landing-terminal-line landing-muted">
                  {t.terminal.line2}
                </div>
                <div className="landing-terminal-divider" />
                {[
                  ["gemini", 100],
                  ["groq", 95],
                  ["ollama", 98],
                ].map(([name, score]) => (
                  <div key={name} className="landing-judge-row">
                    <span className="landing-judge-name">{name}</span>
                    <span className="landing-judge-bar">
                      <i style={{ width: `${score}%` }} />
                    </span>
                    <span className="landing-judge-score">{score}</span>
                  </div>
                ))}
                <div className="landing-terminal-divider" />
                <div className="landing-terminal-line landing-terminal-line-final">
                  <span className="landing-label">{t.terminal.final}</span>
                  <span className="landing-ok">98 / 100</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-container landing-stat-strip">
          {t.stats.map((stat) => (
            <div key={stat.label} className="landing-stat-card">
              <div className="landing-stat-value">{stat.value}</div>
              <div className="landing-stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="landing-section" id="how">
          <div className="landing-container">
            <div className="landing-section-head">
              <div className="landing-section-eyebrow">{t.how.eyebrow}</div>
              <h2 className="landing-section-title">{t.how.title}</h2>
              <p className="landing-section-sub">{t.how.sub}</p>
            </div>
            <div className="landing-step-grid">
              {t.how.steps.map((step, index) => (
                <article key={step.key} className="landing-step-card">
                  <div className="landing-step-meta">
                    <span className="landing-badge">{index + 1}</span>
                    <span>{step.keyLabel}</span>
                  </div>
                  <div className="landing-step-icon">{stepIcons[index]}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  {step.key === "evaluate" ? (
                    <div className="landing-ai-chip-group">
                      <span className="landing-ai-chip gemini">
                        <i />
                        Gemini 2.5 Flash
                      </span>
                      <span className="landing-ai-chip groq">
                        <i />
                        Groq Llama 3.3
                      </span>
                      <span className="landing-ai-chip ollama">
                        <i />
                        Ollama Llama 3.1
                      </span>
                    </div>
                  ) : null}
                  {step.detail ? <div className="landing-step-detail">{step.detail}</div> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-container">
            <div className="landing-section-head">
              <div className="landing-section-eyebrow">{t.features.eyebrow}</div>
              <h2 className="landing-section-title">{t.features.title}</h2>
              <p className="landing-section-sub">{t.features.sub}</p>
            </div>
            <div className="landing-feature-grid">
              {t.features.items.map((feature, index) => (
                <article key={feature.title} className="landing-feature-card">
                  <div className="landing-feature-icon">{featureIcons[index]}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <span className="landing-card-hover-arrow">
                    <ArrowRightOutlined />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="preview">
          <div className="landing-container">
            <div className="landing-section-head">
              <div className="landing-section-eyebrow">{t.preview.eyebrow}</div>
              <h2 className="landing-section-title">{t.preview.title}</h2>
              <p className="landing-section-sub">{t.preview.sub}</p>
            </div>

            <div className="landing-preview-frame">
              <div className="landing-preview-bar">
                <div className="landing-terminal-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>{t.preview.appPath}</span>
              </div>
              <div className="landing-preview-body">
                <aside className="landing-preview-side">
                  <div className="landing-side-logo">
                    <span className="landing-logo-mark small">
                      <CodeOutlined />
                    </span>
                    Codex<span className="landing-logo-accent">IQ</span>
                  </div>
                  <div className="landing-side-item">
                    <BarChartOutlined />
                    {t.preview.sideNav.dashboard}
                  </div>
                  <div className="landing-side-item active">
                    <FileSearchOutlined />
                    {t.preview.sideNav.results}
                  </div>
                  <div className="landing-side-item">
                    <UploadOutlined />
                    {t.preview.sideNav.upload}
                  </div>
                  <div className="landing-side-item">
                    <CheckCircleOutlined />
                    {t.preview.sideNav.students}
                  </div>
                  <div className="landing-side-item">
                    <MessageOutlined />
                    {t.preview.sideNav.messages}
                  </div>
                  <div className="landing-side-item">
                    <GlobalOutlined />
                    {t.preview.sideNav.profile}
                  </div>
                </aside>

                <div className="landing-preview-main">
                  <div className="landing-preview-crumbs">
                    {t.preview.crumbs.results} <span>/</span> {t.preview.crumbs.exam} <span>/</span>{" "}
                    <strong>{t.preview.crumbs.file}</strong>
                  </div>
                  <div className="landing-preview-head">
                    <div>
                      <h3>{t.preview.heading}</h3>
                      <p>{t.preview.studentMeta}</p>
                    </div>
                    <span className="landing-status-pill">
                      <CheckCircleOutlined />
                      {t.preview.status}
                    </span>
                  </div>

                  <div className="landing-score-layout">
                    <div className="landing-score-card">
                      <span className="landing-mini-label">{t.preview.totalScore}</span>
                      <div className="landing-score-value">98</div>
                      <div className="landing-score-sub">/ 100</div>
                      <div className="landing-score-grade-pill">{t.preview.grade}</div>
                    </div>

                    <div className="landing-score-breakdown">
                      <div className="landing-breakdown-head">
                        <span>{t.preview.ensembleTitle}</span>
                        <span>{t.preview.weightedVote}</span>
                      </div>
                      {[
                        ["gemini 2.5", 100],
                        ["groq llama", 95],
                        ["ollama 3.1", 98],
                      ].map(([name, score]) => (
                        <div key={name} className="landing-judge-row wide">
                          <span className="landing-judge-name">{name}</span>
                          <span className="landing-judge-bar">
                            <i style={{ width: `${score}%` }} />
                          </span>
                          <span className="landing-judge-score">{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-code-panel">
                    <div className="landing-code-line">
                      <span className="ln">1</span>
                      <span>def binary_search(arr, target):</span>
                    </div>
                    <div className="landing-code-line warning">
                      <span className="ln">2</span>
                      <span>low, high = 0, len(arr)</span>
                      <span className="landing-code-tag">OFF-BY-ONE</span>
                    </div>
                    <div className="landing-code-line">
                      <span className="ln">3</span>
                      <span>while low &lt;= high:</span>
                    </div>
                    <div className="landing-code-line error">
                      <span className="ln">7</span>
                      <span>elif arr[mid] &lt; target</span>
                      <span className="landing-code-tag error">SYNTAX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <div className="landing-section-eyebrow">{t.roles.eyebrow}</div>
              <h2 className="landing-section-title">{t.roles.title}</h2>
              <p className="landing-section-sub">{t.roles.sub}</p>
            </div>

            <div className="landing-role-grid">
              {t.roles.items.map((role) => (
                <article key={role.tag} className="landing-role-card">
                  <div className="landing-role-tag">{role.tag}</div>
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                  <ul>
                    {role.bullets.map((bullet) => (
                      <li key={bullet}>
                        <CheckCircleOutlined />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-container landing-cta-section" id="contact">
          <div className="landing-cta-card">
            <h2>{t.cta.title}</h2>
            <p>{t.cta.sub}</p>
            <div className="landing-hero-actions">
              <Link to={target ?? "/login"} className="landing-primary-link landing-primary-link-lg">
                {t.login}
                <ArrowRightOutlined />
              </Link>
              <Button
                href="mailto:hello@codexiq.io"
                type="default"
                className="landing-mail-btn"
              >
                {t.cta.contact}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <a href="#top" className="landing-logo">
              <span className="landing-logo-mark">
                <CodeOutlined />
              </span>
              <span>
                Codex<span className="landing-logo-accent">IQ</span>
              </span>
            </a>
            <p className="landing-footer-tag">{t.footer.tag}</p>
          </div>

          <div>
            <h4>{t.footer.product}</h4>
            <ul>
              <li><a href="#features" onClick={handleSectionNav("features")}>{t.nav.features}</a></li>
              <li><a href="#how" onClick={handleSectionNav("how")}>{t.nav.how}</a></li>
              <li><a href="#preview" onClick={handleSectionNav("preview")}>{t.nav.preview}</a></li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.company}</h4>
            <ul>
              <li><a href="#contact" onClick={handleSectionNav("contact")}>{t.nav.contact}</a></li>
              <li>
                <Link to={target ?? "/login"}>{t.login}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.resources}</h4>
            <ul>
              <li><a href="#preview" onClick={handleSectionNav("preview")}>{t.footer.uiPreview}</a></li>
              <li><a href="#how" onClick={handleSectionNav("how")}>{t.footer.workflow}</a></li>
            </ul>
          </div>
        </div>
        <div className="landing-container landing-footer-bottom">{t.footer.rights}</div>
      </footer>
    </div>
  );
}

export default LandingPage;
