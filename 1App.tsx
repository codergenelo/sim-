```tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ─────────────────────── TYPES ─────────────────────── */

interface SimCard {
  id: string;
  simName: string;
  ownerName: string;
  phoneNumber: string;
  email: string;
  simPassword: string;
  pinCode: string;
  pukCode: string;
  country: string;
  balance: string;
  notes: string;
  provider: Provider;
  authType: AuthType;
  image: string;
  createdAt: string;
}

type Provider =
  | "Vodacom"
  | "Airtel"
  | "Tigo"
  | "Halotel"
  | "TTCL"
  | "MTN"
  | "Orange";

type AuthType =
  | "SMS OTP"
  | "Email OTP"
  | "Google Authenticator"
  | "2FA"
  | "Backup Codes";

type ViewMode = "list" | "detail";

/* ─────────────────────── CONSTANTS ─────────────────────── */

const STORAGE_KEY = "sim_card_manager_data";

const PROVIDERS: Provider[] = [
  "Vodacom", "Airtel", "Tigo", "Halotel", "TTCL", "MTN", "Orange",
];

const AUTH_TYPES: AuthType[] = [
  "SMS OTP", "Email OTP", "Google Authenticator", "2FA", "Backup Codes",
];

const COUNTRIES = [
  "Tanzania", "Kenya", "Uganda", "Nigeria", "South Africa",
  "Ghana", "Rwanda", "Burundi", "Mozambique", "DRC",
  "Zambia", "Malawi", "Ethiopia", "Other",
];

const PROVIDER_COLORS: Record<Provider, string> = {
  Vodacom: "#e60000",
  Airtel: "#ed1c24",
  Tigo: "#00a3e0",
  Halotel: "#00a651",
  TTCL: "#ff8c00",
  MTN: "#ffcc00",
  Orange: "#ff6600",
};

const PROVIDER_BG: Record<Provider, string> = {
  Vodacom: "rgba(230,0,0,0.15)",
  Airtel: "rgba(237,28,36,0.15)",
  Tigo: "rgba(0,163,224,0.15)",
  Halotel: "rgba(0,166,81,0.15)",
  TTCL: "rgba(255,140,0,0.15)",
  MTN: "rgba(255,204,0,0.15)",
  Orange: "rgba(255,102,0,0.15)",
};

/* ─────────────────────── HELPERS ─────────────────────── */

function generateId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function loadSims(): SimCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSims(sims: SimCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sims));
  } catch {
    /* storage full — silently fail */
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function maskSecret(str: string): string {
  if (!str) return "—";
  if (str.length <= 4) return "•".repeat(str.length);
  return str.slice(0, 2) + "•".repeat(str.length - 4) + str.slice(-2);
}

/* ─────────────────────── ICONS (inline SVG components) ─────────────────────── */

function IconSim() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18.01" />
      <path d="M9 6h6v4H9z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" />
      <path d="M8.53 16.11a6 6 0 016.95 0" /><circle cx="12" cy="20" r="1" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function SimCardManager() {
  /* state */
  const [sims, setSims] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedSim, setSelectedSim] = useState<SimCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState<Provider | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* form state */
  const [form, setForm] = useState({
    simName: "",
    ownerName: "",
    phoneNumber: "",
    email: "",
    simPassword: "",
    pinCode: "",
    pukCode: "",
    country: "Tanzania",
    balance: "",
    notes: "",
    provider: "Vodacom" as Provider,
    authType: "SMS OTP" as AuthType,
    image: "",
  });

  /* load sims on mount */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSims(loadSims());
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  /* persist sims */
  useEffect(() => {
    if (!loading) saveSims(sims);
  }, [sims, loading]);

  /* filtered sims */
  const filteredSims = useMemo(() => {
    return sims.filter((sim) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sim.simName.toLowerCase().includes(q) ||
        sim.ownerName.toLowerCase().includes(q) ||
        sim.phoneNumber.includes(q) ||
        sim.email.toLowerCase().includes(q) ||
        sim.provider.toLowerCase().includes(q);
      const matchesProvider = filterProvider === "All" || sim.provider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [sims, searchQuery, filterProvider]);

  /* stats */
  const stats = useMemo(() => {
    const providerCounts: Record<string, number> = {};
    PROVIDERS.forEach((p) => (providerCounts[p] = 0));
    sims.forEach((s) => {
      if (providerCounts[s.provider] !== undefined) providerCounts[s.provider]++;
    });
    const totalBalance = sims.reduce((acc, s) => {
      const val = parseFloat(s.balance);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return { total: sims.length, providerCounts, totalBalance };
  }, [sims]);

  /* reset form */
  const resetForm = useCallback(() => {
    setForm({
      simName: "", ownerName: "", phoneNumber: "", email: "",
      simPassword: "", pinCode: "", pukCode: "", country: "Tanzania",
      balance: "", notes: "", provider: "Vodacom", authType: "SMS OTP", image: "",
    });
    setImagePreview("");
    setFormErrors({});
  }, []);

  /* image upload handler */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, image: "Image must be under 2MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setForm((prev) => ({ ...prev, image: result }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }, []);

  /* validate form */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.simName.trim()) errors.simName = "SIM name is required";
    if (!form.ownerName.trim()) errors.ownerName = "Owner name is required";
    if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  /* submit handler */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;
      const newSim: SimCard = {
        id: generateId(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      setSims((prev) => [newSim, ...prev]);
      resetForm();
      setShowForm(false);
    },
    [form, validateForm, resetForm]
  );

  /* delete handler */
  const handleDelete = useCallback((id: string) => {
    setSims((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
    if (selectedSim?.id === id) {
      setSelectedSim(null);
      setViewMode("list");
    }
  }, [selectedSim]);

  /* open detail */
  const openDetail = useCallback((sim: SimCard) => {
    setSelectedSim(sim);
    setViewMode("detail");
    setRevealedFields({});
  }, []);

  /* toggle reveal */
  const toggleReveal = useCallback((field: string) => {
    setRevealedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  /* ──────────── RENDER ──────────── */

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-gray-200 overflow-hidden">
      {/* inject custom styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.45); }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 20px rgba(59,130,246,0.6); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .anim-fade-up { animation: fadeInUp 0.5s ease-out forwards; }
        .anim-fade { animation: fadeIn 0.4s ease-out forwards; }
        .anim-slide-right { animation: slideInRight 0.4s ease-out forwards; }
        .anim-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .anim-shimmer {
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.08), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        .glass {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.1);
        }
        .glass-strong {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(59, 130, 246, 0.15);
        }
        .glass-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.4));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.1), inset 0 0 25px rgba(59, 130, 246, 0.03);
          transform: translateY(-2px);
        }
        .glow-border {
          position: relative;
        }
        .glow-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(59,130,246,0.4), transparent 40%, transparent 60%, rgba(59,130,246,0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .glow-border:hover::before { opacity: 1; }

        .input-field {
          background: rgba(8, 12, 24, 0.7);
          border: 1px solid rgba(59, 130, 246, 0.12);
          border-radius: 10px;
          padding: 10px 14px;
          color: #e2e8f0;
          font-size: 13px;
          transition: all 0.25s;
          width: 100%;
          outline: none;
        }
        .input-field:focus {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 0 15px rgba(59, 130, 246, 0.08);
        }
        .input-field::placeholder { color: rgba(148, 163, 184, 0.5); }

        select.input-field {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }
        select.input-field option { background: #0f172a; color: #e2e8f0; }

        textarea.input-field { resize: vertical; min-height: 70px; }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.25s;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 0 25px rgba(37, 99, 235, 0.4);
          transform: translateY(-1px);
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
        }
        .btn-ghost {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s;
          font-size: 12px;
        }
        .btn-ghost:hover {
          color: #e2e8f0;
          border-color: rgba(148, 163, 184, 0.3);
          background: rgba(148, 163, 184, 0.05);
        }

        .stat-card {
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 60px; height: 60px;
          border-radius: 0 0 0 60px;
          opacity: 0.06;
        }

        .sim-item {
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* ─── BACKGROUND EFFECTS ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.02] rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.015] rounded-full blur-[180px]" />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 glass-strong">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <IconSim />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">SIM VAULT</h1>
              <p className="text-[10px] text-blue-400/70 font-medium tracking-widest uppercase">Secure Manager</p>
            </div>
          </div>

          {/* Desktop stats */}
          <div className="hidden md:flex items-center gap-2">
            {PROVIDERS.filter((p) => stats.providerCounts[p] > 0).map((p) => (
              <div
                key={p}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: PROVIDER_BG[p],
                  color: PROVIDER_COLORS[p],
                  border: `1px solid ${PROVIDER_COLORS[p]}22`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: PROVIDER_COLORS[p] }} />
                {p} <span className="opacity-70">{stats.providerCounts[p]}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-blue-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {stats.total} SIM{stats.total !== 1 ? "s" : ""} Stored
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="btn-primary text-xs"
            >
              <IconPlus /> <span className="hidden sm:inline">Add SIM</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 max-w-[1920px] mx-auto flex" style={{ height: "calc(100vh - 64px)" }}>

        {/* ═══ LEFT SIDEBAR — FORM ═══ */}
        <aside
          className={`${
            showForm ? "w-[380px] min-w-[380px]" : "w-0 min-w-0 overflow-hidden"
          } transition-all duration-500 ease-in-out border-r border-blue-500/[0.06] hidden lg:block`}
        >
          <div className="h-full overflow-y-auto p-5" style={{ width: 380 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400" />
                Add New SIM
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">SIM Photo / Avatar</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-28 rounded-xl border-2 border-dashed border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer overflow-hidden group"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[11px] mt-1">Click to upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Change Image</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {formErrors.image && <p className="text-[11px] text-red-400 mt-1">{formErrors.image}</p>}
              </div>

              {/* SIM Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">SIM Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Business Line"
                  value={form.simName}
                  onChange={(e) => setForm((p) => ({ ...p, simName: e.target.value }))}
                />
                {formErrors.simName && <p className="text-[11px] text-red-400 mt-1">{formErrors.simName}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Owner Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="John Doe"
                  value={form.ownerName}
                  onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                />
                {formErrors.ownerName && <p className="text-[11px] text-red-400 mt-1">{formErrors.ownerName}</p>}
              </div>

              {/* Phone & Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+255 xxx xxx xxx"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  />
                  {formErrors.phoneNumber && <p className="text-[11px] text-red-400 mt-1">{formErrors.phoneNumber}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="user@email.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  {formErrors.email && <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Security Fields */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <IconShield /> Security Credentials
                </label>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">SIM Password</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter SIM password"
                    value={form.simPassword}
                    onChange={(e) => setForm((p) => ({ ...p, simPassword: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">PIN Code</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 1234"
                      value={form.pinCode}
                      onChange={(e) => setForm((p) => ({ ...p, pinCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">PUK Code</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter PUK"
                      value={form.pukCode}
                      onChange={(e) => setForm((p) => ({ ...p, pukCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Provider & Auth Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Network Provider</label>
                  <select
                    className="input-field"
                    value={form.provider}
                    onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value as Provider }))}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Auth Type</label>
                  <select
                    className="input-field"
                    value={form.authType}
                    onChange={(e) => setForm((p) => ({ ...p, authType: e.target.value as AuthType }))}
                  >
                    {AUTH_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Country & Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
                  <select
                    className="input-field"
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Balance</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 5000"
                    value={form.balance}
                    onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
                <textarea
                  className="input-field"
                  placeholder="Additional notes about this SIM..."
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary w-full justify-center py-3 text-sm">
                <IconPlus /> Save SIM Card
              </button>
            </form>
          </div>
        </aside>

        {/* ═══ MOBILE FORM OVERLAY ═══ */}
        {showForm && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="absolute inset-x-0 bottom-0 top-12 bg-[#0a0f1a] rounded-t-2xl overflow-y-auto anim-fade-up border-t border-blue-500/20">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">Add New SIM</h2>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">&times;</button>
                </div>
                <MobileForm
                  form={form}
                  setForm={setForm}
                  formErrors={formErrors}
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                  handleSubmit={handleSubmit}
                  resetForm={resetForm}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ MIDDLE — SIM LIST ═══ */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-blue-500/[0.06] space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><IconSearch /></span>
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search by name, number, provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input-field w-auto min-w-[130px]"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value as Provider | "All")}
              >
                <option value="All">All Providers</option>
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {/* Quick stats bar */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>{filteredSims.length} result{filteredSims.length !== 1 ? "s" : ""}</span>
              {stats.total > 0 && (
                <span>Total Balance: <span className="text-blue-400 font-semibold">{stats.totalBalance.toLocaleString()}</span></span>
              )}
            </div>
          </div>

          {/* SIM Cards List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredSims.length === 0 ? (
              <EmptyState hasSearch={searchQuery.length > 0 || filterProvider !== "All"} onAdd={() => { resetForm(); setShowForm(true); }} />
            ) : (
              filteredSims.map((sim, index) => (
                <SimCardItem
                  key={sim.id}
                  sim={sim}
                  index={index}
                  isSelected={selectedSim?.id === sim.id}
                  onClick={() => openDetail(sim)}
                  onDeleteClick={() => setDeleteConfirm(sim.id)}
                  deleteConfirm={deleteConfirm === sim.id}
                  onConfirmDelete={() => handleDelete(sim.id)}
                  onCancelDelete={() => setDeleteConfirm(null)}
                />
              ))
            )}
          </div>
        </main>

        {/* ═══ RIGHT — DETAIL PANEL ═══ */}
        <aside
          className={`${
            viewMode === "detail" && selectedSim
              ? "w-[420px] min-w-[420px]"
              : "w-0 min-w-0 overflow-hidden"
          } transition-all duration-500 ease-in-out border-l border-blue-500/[0.06] hidden lg:block`}
        >
          {selectedSim && viewMode === "detail" ? (
            <div className="h-full overflow-y-auto" style={{ width: 420 }}>
              <DetailPanel
                sim={selectedSim}
                revealedFields={revealedFields}
                toggleReveal={toggleReveal}
                onBack={() => { setViewMode("list"); setSelectedSim(null); }}
                onDelete={() => setDeleteConfirm(selectedSim.id)}
                deleteConfirm={deleteConfirm === selectedSim.id}
                onConfirmDelete={() => handleDelete(selectedSim.id)}
                onCancelDelete={() => setDeleteConfirm(null)}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center" style={{ width: 420 }}>
              <div className="text-center px-8 anim-fade">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <IconSim />
                </div>
                <p className="text-sm text-slate-500">Select a SIM card to view details</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ═══ MOBILE DETAIL OVERLAY ═══ */}
      {viewMode === "detail" && selectedSim && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setViewMode("list"); setSelectedSim(null); }} />
          <div className="absolute inset-0 bg-[#06080f] overflow-y-auto anim-slide-right pt-4">
            <DetailPanel
              sim={selectedSim}
              revealedFields={revealedFields}
              toggleReveal={toggleReveal}
              onBack={() => { setViewMode("list"); setSelectedSim(null); }}
              onDelete={() => setDeleteConfirm(selectedSim.id)}
              deleteConfirm={deleteConfirm === selectedSim.id}
              onConfirmDelete={() => handleDelete(selectedSim.id)}
              onCancelDelete={() => setDeleteConfirm(null)}
            />
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full anim-fade-up">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-center mb-2">Delete SIM Card?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">This action cannot be undone. All stored data for this SIM will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500" style={{ animation: "spin-slow 1s linear infinite" }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-400" style={{ animation: "spin-slow 1.5s linear infinite reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" /><path d="M9 6h6v4H9z" />
            </svg>
          </div>
        </div>
        <h2 className="text-white font-bold text-lg mb-1">SIM VAULT</h2>
        <p className="text-slate-500 text-sm">Loading secure data...</p>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 anim-fade">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/10 flex items-center justify-center mb-6">
        {hasSearch ? (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" />
            <line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="11" x2="15" y2="11" />
          </svg>
        )}
      </div>
      <h3 className="text-white font-semibold mb-2">
        {hasSearch ? "No Results Found" : "No SIM Cards Yet"}
      </h3>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
        {hasSearch
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Start by adding your first SIM card. All data is stored securely on your device."}
      </p>
      {!hasSearch && (
        <button onClick={onAdd} className="btn-primary">
          <IconPlus /> Add Your First SIM
        </button>
      )}
    </div>
  );
}

function SimCardItem({
  sim, index, isSelected, onClick, onDeleteClick,
  deleteConfirm, onConfirmDelete, onCancelDelete,
}: {
  sim: SimCard;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDeleteClick: () => void;
  deleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const providerColor = PROVIDER_COLORS[sim.provider];
  const providerBg = PROVIDER_BG[sim.provider];

  return (
    <div
      className={`sim-item glass-card glow-border rounded-xl p-4 cursor-pointer ${isSelected ? "ring-1 ring-blue-500/40" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border"
          style={{ borderColor: providerColor + "44" }}
        >
          {sim.image ? (
            <img src={sim.image} alt={sim.simName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ background: providerBg, color: providerColor }}>
              {sim.simName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{sim.simName}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
              style={{ background: providerBg, color: providerColor }}
            >
              {sim.provider}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-1.5">{sim.ownerName}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><IconPhone /> {sim.phoneNumber}</span>
            {sim.email && <span className="flex items-center gap-1 hidden sm:flex"><IconMail /> {sim.email}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <span className="text-[10px] text-slate-600">{formatDate(sim.createdAt).split(",")[0]}</span>
          {deleteConfirm ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={onConfirmDelete} className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer">Yes</button>
              <button onClick={onCancelDelete} className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 hover:bg-white/10 transition-colors cursor-pointer">No</button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick(); }}
              className="btn-danger text-[10px] py-1 px-2 opacity-0 group-hover:opacity-100"
              style={{ opacity: undefined }}
            >
              <IconTrash />
            </button>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><IconGlobe /> {sim.country}</span>
          <span className="flex items-center gap-1"><IconShield /> {sim.authType}</span>
        </div>
        {sim.balance && (
          <span className="text-[11px] font-semibold text-blue-400"> Balance: {sim.balance}</span>
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  sim, revealedFields, toggleReveal, onBack, onDelete,
  deleteConfirm, onConfirmDelete, onCancelDelete,
}: {
  sim: SimCard;
  revealedFields: Record<string, boolean>;
  toggleReveal: (field: string) => void;
  onBack: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const providerColor = PROVIDER_COLORS[sim.provider];
  const providerBg = PROVIDER_BG[sim.provider];

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5">
          <IconBack /> Back
        </button>
        {deleteConfirm ? (
          <div className="flex gap-1.5">
            <button onClick={onConfirmDelete} className="text-[11px] px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-pointer">Confirm Delete</button>
            <button onClick={onCancelDelete} className="btn-ghost text-[11px]">Cancel</button>
          </div>
        ) : (
          <button onClick={onDelete} className="btn-danger text-[11px]">
            <IconTrash /> Delete
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${providerColor}33, ${providerColor}11)` }}>
          <div className="absolute inset-0 anim-shimmer" />
          <div className="absolute -bottom-8 left-5">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#0a0f1a] shadow-xl"
              style={{ boxShadow: `0 0 20px ${providerColor}33` }}
            >
              {sim.image ? (
                <img src={sim.image} alt={sim.simName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ background: providerBg, color: providerColor }}>
                  {sim.simName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pt-11 px-5 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">{sim.simName}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: providerBg, color: providerColor, border: `1px solid ${providerColor}33` }}>
              {sim.provider}
            </span>
          </div>
          <p className="text-sm text-slate-400">{sim.ownerName}</p>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1"><IconCalendar /> Added {formatDate(sim.createdAt)}</p>
        </div>
      </div>

      {/* Owner Information */}
      <DetailSection icon={<IconUser />} title="Owner Information" color="#3b82f6">
        <DetailRow icon={<IconPhone />} label="Phone Number" value={sim.phoneNumber} />
        <DetailRow icon={<IconMail />} label="Email" value={sim.email || "—"} />
        <DetailRow icon={<IconGlobe />} label="Country" value={sim.country} />
        <DetailRow icon={<IconWallet />} label="Balance" value={sim.balance ? sim.balance : "—"} highlight />
      </DetailSection>

      {/* Security Information */}
      <DetailSection icon={<IconShield />} title="Security Information" color="#f59e0b">
        <SecretRow
          label="SIM Password"
          value={sim.simPassword}
          revealed={!!revealedFields["password"]}
          onToggle={() => toggleReveal("password")}
        />
        <SecretRow
          label="PIN Code"
          value={sim.pinCode}
          revealed={!!revealedFields["pin"]}
          onToggle={() => toggleReveal("pin")}
        />
        <SecretRow
          label="PUK Code"
          value={sim.pukCode}
          revealed={!!revealedFields["puk"]}
          onToggle={() => toggleReveal("puk")}
        />
        <DetailRow icon={<IconShield />} label="Authentication Type" value={sim.authType} />
      </DetailSection>

      {/* Network Information */}
      <DetailSection icon={<IconNetwork />} title="Network Information" color="#10b981">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-slate-400">Provider</span>
          <span className="text-xs font-semibold" style={{ color: providerColor }}>{sim.provider}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, (statsForProvider(sim.provider) / Math.max(1, getTotalSims())) * 100)}%`,
              background: `linear-gradient(90deg, ${providerColor}, ${providerColor}88)`,
            }}
          />
        </div>
        <p className="text-[10px] text-slate-600 mt-1">{statsForProvider(sim.provider)} of {getTotalSims()} SIMs use {sim.provider}</p>
      </DetailSection>

      {/* Notes */}
      {sim.notes && (
        <DetailSection icon={<IconNote />} title="Notes" color="#8b5cf6">
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{sim.notes}</p>
        </DetailSection>
      )}

      <div className="h-8" />
    </div>
  );
}

function DetailSection({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden anim-fade">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2" style={{ borderBottomColor: color + "15" }}>
        <span style={{ color }}>{icon}</span>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 py-2 space-y-0.5">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-slate-400 flex items-center gap-1.5">{icon} {label}</span>
      <span className={`text-xs font-medium ${highlight ? "text-blue-400 font-semibold" : "text-slate-200"}`}>{value}</span>
    </div>
  );
}

function SecretRow({ label, value, revealed, onToggle }: { label: string; value: string; revealed: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-200">{revealed ? (value || "—") : maskSecret(value)}</span>
        {value && (
          <button
            onClick={onToggle}
            className="text-slate-500 hover:text-blue-400 transition-colors cursor-pointer p-0.5"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
    </div>
  );
}

/* helper to keep detail panel self-contained */
let _simsCache: SimCard[] = [];
function statsForProvider(provider: Provider): number {
  try {
    const sims = loadSims();
    return sims.filter((s) => s.provider === provider).length;
  } catch { return 0; }
}
function getTotalSims(): number {
  try { return loadSims().length; } catch { return 0; }
}

/* Mobile Form */
function MobileForm({
  form, setForm, formErrors, imagePreview, fileInputRef,
  handleImageUpload, handleSubmit, resetForm,
}: {
  form: typeof SimCardManager extends () => JSX.Element ? never : any;
  setForm: any;
  formErrors: Record<string, string>;
  imagePreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">SIM Photo</label>
        <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-24 rounded-xl border-2 border-dashed border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer overflow-hidden group">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <span className="text-[11px] mt-1">Upload Photo</span>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        {formErrors.image && <p className="text-[11px] text-red-400 mt-1">{formErrors.image}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">SIM Name *</label>
        <input type="text" className="input-field" placeholder="e.g. Business Line" value={form.simName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, simName: e.target.value }))} />
        {formErrors.simName && <p className="text-[11px] text-red-400 mt-1">{formErrors.simName}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Owner Name *</label>
        <input type="text" className="input-field" placeholder="John Doe" value={form.ownerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, ownerName: e.target.value }))} />
        {formErrors.ownerName && <p className="text-[11px] text-red-400 mt-1">{formErrors.ownerName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone *</label>
          <input type="tel" className="input-field" placeholder="+255..." value={form.phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, phoneNumber: e.target.value }))} />
          {formErrors.phoneNumber && <p className="text-[11px] text-red-400 mt-1">{formErrors.phoneNumber}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
          <input type="email" className="input-field" placeholder="user@email.com" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, email: e.target.value }))} />
          {formErrors.email && <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">SIM Password</label>
        <input type="text" className="input-field" placeholder="Enter password" value={form.simPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, simPassword: e.target.value }))} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">PIN</label>
          <input type="text" className="input-field" placeholder="1234" value={form.pinCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, pinCode: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">PUK</label>
          <input type="text" className="input-field" placeholder="Enter PUK" value={form.pukCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, pukCode: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Provider</label>
          <select className="input-field" value={form.provider} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p: any) => ({ ...p, provider: e.target.value }))}>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Auth Type</label>
          <select className="input-field" value={form.authType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p: any) => ({ ...p, authType: e.target.value }))}>
            {AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
          <select className="input-field" value={form.country} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p: any) => ({ ...p, country: e.target.value }))}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Balance</label>
          <input type="text" className="input-field" placeholder="5000" value={form.balance} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, balance: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
        <textarea className="input-field" placeholder="Additional notes..." rows={3} value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p: any) => ({ ...p, notes: e.target.value }))} />
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3 text-sm">
        <IconPlus /> Save SIM Card
      </button>
    </form>
  );
}
