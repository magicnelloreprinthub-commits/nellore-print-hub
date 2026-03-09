import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogIn, LogOut, Menu, User, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  useGetMessagesForCustomer,
  useGetSiteSettings,
} from "../../hooks/useQueries";
import { LANGUAGES, useLang } from "../../lib/i18n";
import CustomerMessagesModal from "../CustomerMessagesModal";
import LoginModal from "../LoginModal";

const FALLBACK_LOGO =
  "/assets/generated/nellore-print-hub-logo-transparent.dim_600x200.png";

function getLogoUrl(): string {
  return localStorage.getItem("nph_logo_url") || FALLBACK_LOGO;
}

interface StoredCustomer {
  id: string;
  name: string;
  mobile: string;
  visitCount: string;
  firstVisit: string;
  lastVisit: string;
}

function getStoredCustomer(): StoredCustomer | null {
  try {
    const raw = localStorage.getItem("nph_customer");
    if (!raw) return null;
    return JSON.parse(raw) as StoredCustomer;
  } catch {
    return null;
  }
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(() => getLogoUrl());
  const [loginOpen, setLoginOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [customer, setCustomer] = useState<StoredCustomer | null>(
    getStoredCustomer,
  );
  const { t, lang, setLang } = useLang();
  const { data: settings } = useGetSiteSettings();
  const siteName = settings?.siteName ?? "Nellore Print Hub";

  // Fetch messages for the logged-in customer
  const { data: customerMessages } = useGetMessagesForCustomer(
    customer?.mobile ?? "",
  );
  const unreadCount = customerMessages?.filter((m) => !m.isRead).length ?? 0;

  const navLinks = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.services, href: "#services" },
    { label: t.nav.quote, href: "#quote" },
    { label: t.nav.gallery, href: "#gallery" },
    { label: t.nav.contact, href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync logo from siteSettings when loaded
  useEffect(() => {
    if (settings?.logoUrl) {
      setLogoSrc(settings.logoUrl);
      localStorage.setItem("nph_logo_url", settings.logoUrl);
    }
  }, [settings?.logoUrl]);

  // Listen for logo updates from admin panel
  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) {
        setLogoSrc(detail.url);
      } else {
        setLogoSrc(getLogoUrl());
      }
    };
    const handleStorage = () => setLogoSrc(getLogoUrl());
    window.addEventListener("logo-updated", handleLogoUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("logo-updated", handleLogoUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Listen for customer login/logout events
  useEffect(() => {
    const handleCustomerUpdate = () => {
      setCustomer(getStoredCustomer());
    };
    window.addEventListener("customer-updated", handleCustomerUpdate);
    return () =>
      window.removeEventListener("customer-updated", handleCustomerUpdate);
  }, []);

  // Auto-open login modal for first-time visitors
  useEffect(() => {
    const handleOpenLogin = () => {
      setLoginOpen(true);
    };
    window.addEventListener("open-login-modal", handleOpenLogin);
    return () =>
      window.removeEventListener("open-login-modal", handleOpenLogin);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("nph_customer");
    setCustomer(null);
    window.dispatchEvent(new Event("customer-updated"));
  };

  // Get first name + initials for display
  const firstName = customer?.name?.split(" ")[0] ?? "";
  const initials = customer?.name
    ? customer.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass-dark shadow-card" : "bg-black/70 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavClick("#home")}
            className="flex items-center group flex-shrink-0"
            aria-label="Nellore Print Hub - Go to top"
          >
            <img
              src={logoSrc}
              alt={siteName}
              className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-sm"
              style={{ maxWidth: "180px" }}
              onError={() => setLogoSrc(FALLBACK_LOGO)}
            />
          </button>

          {/* Desktop Nav */}
          <nav
            className="hidden md:flex items-center gap-1 flex-1 justify-center"
            aria-label="Primary navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-ocid="nav.link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-200 relative group"
              >
                {link.label}
                <span className="absolute bottom-0.5 left-4 right-4 h-0.5 brand-gradient rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </nav>

          {/* Right side: Language + Login + Mobile Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language switcher */}
            <div
              className="hidden sm:flex items-center gap-1 rounded-lg border border-white/12 p-1"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  data-ocid={`lang.${l.code}.toggle`}
                  onClick={() => setLang(l.code)}
                  className={`w-8 h-7 rounded-md text-xs font-bold transition-all duration-200 ${
                    lang === l.code
                      ? "brand-gradient text-white shadow-sm"
                      : "text-white/50 hover:text-white/80 hover:bg-white/10"
                  }`}
                  title={l.label}
                  aria-label={`Switch to ${l.label}`}
                >
                  {l.native}
                </button>
              ))}
            </div>

            {/* Bell icon for logged-in customer messages */}
            {customer && (
              <button
                type="button"
                data-ocid="header.messages.button"
                onClick={() => setMessagesOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10"
                aria-label="My Messages"
                title="My Messages"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#e1306c] text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Login / User pill */}
            {customer ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  data-ocid="header.user.dropdown_menu"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 hover:border-white/25 transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                  style={{ background: "rgba(225,48,108,0.12)" }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 brand-gradient">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-white/85 max-w-[90px] truncate hidden sm:block">
                    Hi, {firstName}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 rounded-xl border border-white/12 shadow-xl p-1"
                  style={{ background: "rgba(10,10,10,0.98)" }}
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-semibold text-white/90 truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {customer.mobile}
                    </p>
                  </div>
                  <DropdownMenuItem
                    data-ocid="header.messages.open_modal_button"
                    onClick={() => setMessagesOpen(true)}
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-lg cursor-pointer font-medium"
                  >
                    <Bell className="w-4 h-4" />
                    My Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-4 rounded-full bg-[#e1306c] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-ocid="header.logout.button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                data-ocid="header.login.button"
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] shadow-sm brand-gradient"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/8 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Brand stripe */}
        <div
          className="w-full h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #f56040, #fcb045)",
            opacity: 0.9,
          }}
        />

        {/* Mobile Nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass-dark border-t border-white/8 px-6 py-4 flex flex-col gap-1"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-ocid="nav.link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile language switcher */}
            <div
              className="flex items-center gap-1 rounded-lg border border-white/12 p-1 mt-2 self-start"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  data-ocid={`lang.${l.code}.toggle`}
                  onClick={() => setLang(l.code)}
                  className={`w-8 h-7 rounded-md text-xs font-bold transition-all duration-200 ${
                    lang === l.code
                      ? "brand-gradient text-white shadow-sm"
                      : "text-white/50 hover:text-white/80 hover:bg-white/10"
                  }`}
                  title={l.label}
                >
                  {l.native}
                </button>
              ))}
            </div>

            {/* Mobile login / user */}
            {customer ? (
              <div className="space-y-2 mt-1">
                {/* Messages button */}
                <button
                  type="button"
                  data-ocid="header.messages.button"
                  onClick={() => {
                    setMessagesOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/8 transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="relative">
                    <Bell className="w-4 h-4 text-white/70" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full bg-[#e1306c] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-white/70 font-medium">
                    My Messages
                  </span>
                  {unreadCount > 0 && (
                    <span className="ml-auto text-[#e1306c] text-xs font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </button>

                {/* User info + logout */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10"
                  style={{ background: "rgba(225,48,108,0.12)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold brand-gradient">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">
                        {customer.name}
                      </p>
                      <p className="text-xs text-white/40">{customer.mobile}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid="header.logout.button"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="header.login.button"
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-white mt-1 transition-all duration-200 brand-gradient"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </motion.header>

      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Customer Messages Modal */}
      {customer && (
        <CustomerMessagesModal
          open={messagesOpen}
          onOpenChange={setMessagesOpen}
          mobile={customer.mobile}
          customerName={customer.name}
        />
      )}
    </>
  );
}
