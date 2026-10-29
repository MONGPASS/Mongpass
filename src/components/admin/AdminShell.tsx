"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Flag,
  Home,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Star,
  Settings,
  Users,
} from "lucide-react";
import type { User } from "@/lib/userStore";
import { logout } from "@/lib/userStore";
import { adminFetch, CATEGORY_KO, type Overview } from "@/lib/admin/types";
import "./admin.css";
import "./business.css";
import "./business-mobile.css";
import { AdminLanguage } from "./AdminLanguage";
import { businessText } from "@/lib/admin/businessMessages";
import BusinessMobileNav from "@/components/biz/BusinessMobileNav";
import type { Shop } from "@/lib/shopStore";
import { getCategoryInfo } from "@/lib/categories";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";

const platformSections = [
  { href: "/admin", label: "관리자 홈", icon: Home, group: "대시보드" },
  {
    href: "/admin/shops",
    label: "업체 관리",
    icon: Store,
    group: "서비스 관리",
  },
  { href: "/admin/orders", label: "주문·예약", icon: ShoppingBag },
  { href: "/admin/users", label: "회원 관리", icon: Users },
  { href: "/admin/reports", label: "신고 관리", icon: Flag },
  {
    href: "/admin/banner",
    label: "배너 관리",
    icon: ImageIcon,
    group: "콘텐츠 관리",
  },
  { href: "/admin/news", label: "소식·공지", icon: Newspaper },
];

export default function AdminShell({
  children,
  user,
  preview = false,
  previewTotals,
  business,
  notice,
}: {
  children: React.ReactNode;
  user: User;
  preview?: boolean;
  previewTotals?: { pending: number; reports: number };
  business?: { shop: Shop; pending: number; unread: number };
  notice?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panel, setPanel] = useState<
    "notifications" | "profile" | "help" | null
  >(null);
  const [search, setSearch] = useState("");
  const [platformCounts, setCounts] = useState(
    previewTotals ?? { pending: 0, reports: 0 },
  );
  const isBusiness = !!business;
  const t = isBusiness ? businessText : (text: string) => text;
  const counts = business
    ? { pending: business.pending, reports: business.unread }
    : platformCounts;
  const sections = business
    ? [
        { href: "/biz", label: t("업체 홈"), icon: Home, group: t("내 비즈니스") },
        {
          href: "/biz/orders",
          label: t("주문·예약 관리"),
          icon: ShoppingBag,
          group: t("고객 관리"),
        },
        { href: "/biz/chat", label: t("고객 채팅"), icon: MessageCircle },
        { href: "/biz/reviews", label: t("리뷰 관리"), icon: Star },
        {
          href:
            getCategoryInfo(business.shop.category).adminRoute ??
            "/biz/profile",
          label: t("상품·서비스 관리"),
          icon: Store,
          group: t("업체 관리"),
        },
        { href: "/biz/notices", label: t("업체 소식"), icon: Newspaper },
        { href: "/biz/profile", label: t("기본 정보·설정"), icon: Settings },
      ].filter(
        (item, index, all) =>
          all.findIndex((other) => other.href === item.href) === index,
      )
    : platformSections;
  const home = isBusiness ? "/biz" : "/admin";
  const previewHome = isBusiness ? "/preview/biz" : "/preview/admin";
  const panelRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (preview || isBusiness) return;
    let active = true;
    const refresh = () =>
      adminFetch<Overview>("/api/admin/overview?days=7")
        .then((data) => {
          if (active)
            setCounts({
              pending: data.totals.pending,
              reports: data.totals.reports,
            });
        })
        .catch(() => {});
    refresh();
    window.addEventListener("admin-data-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("admin-data-changed", refresh);
    };
  }, [preview, isBusiness]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    setPanel(null);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname]);
  const currentPath = preview ? pathname.replace("/preview", "") : pathname;
  const activeSection = sections.find(
    (section) => section.href === currentPath,
  );
  const navigate = (href: string) =>
    preview
      ? isBusiness
        ? businessPreviewHref(href)
        : "/login?redirect=" + encodeURIComponent(href)
      : href;

  return (
    <AdminLanguage.Provider value={isBusiness ? "mn" : "ko"}>
    <div className={`mp-admin${isBusiness ? " mp-business" : ""}`} lang={isBusiness ? "mn" : "ko"}>
      <a className="mp-skip" href="#admin-main">
        {t("본문으로 바로가기")}
      </a>
      <header className="mp-header">
        <button
          className="mp-icon-button mp-mobile-menu"
          aria-label={t("메뉴 열기")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu size={21} />
        </button>
        <Link
          href={preview ? previewHome : home}
          className="mp-brand"
          aria-label={t("Mongpass 관리자 홈")}
        >
          <span className="mp-brand-symbol">
            m<span>•</span>
          </span>
          <span>
            mongpass<span className="mp-brand-label">{t("비즈니스")}</span>
          </span>
        </Link>
        {business && <Link className="mp-mobile-business-title" href={preview ? previewHome : home}>
          <small>Mongpass Бизнес</small><b>{business.shop.name}</b>
        </Link>}
        <nav className="mp-top-nav" aria-label={t("서비스")}>
          <Link href={preview ? previewHome : home} className="active">
            {isBusiness ? t("비즈프로필") : t("최고관리자")}
          </Link>
          {(user.role === "admin" || preview) && (
            <Link
              href={
                preview
                  ? isBusiness
                    ? "/preview/admin"
                    : "/preview/biz"
                  : isBusiness
                    ? "/admin"
                    : "/biz"
              }
            >
              {isBusiness ? t("최고관리자") : t("업체 관리자")}{" "}
              <ArrowUpRight size={13} />
            </Link>
          )}
          <Link
            href={preview && isBusiness ? "/preview/biz/store" : "/"}
            target="_blank"
          >
            {t("Mongpass 서비스")} <ArrowUpRight size={13} />
          </Link>
        </nav>
        <div className="mp-header-actions" ref={panelRef}>
          <button
            className="mp-help-button"
            aria-expanded={panel === "help"}
            onClick={() => setPanel(panel === "help" ? null : "help")}
          >
            {t("이용 가이드")} <CircleHelp size={15} />
          </button>
          <button
            className="mp-icon-button mp-bell"
            aria-label={t("운영 알림")}
            aria-expanded={panel === "notifications"}
            onClick={() =>
              setPanel(panel === "notifications" ? null : "notifications")
            }
          >
            <Bell size={20} />
            {counts.pending + counts.reports > 0 && <i />}
          </button>
          <span className="mp-header-divider" />
          <button
            className="mp-profile-button"
            aria-expanded={panel === "profile"}
            onClick={() => setPanel(panel === "profile" ? null : "profile")}
          >
            <span className="mp-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span>{preview ? t("미리보기") : user.name}</span>
            <ChevronDown size={14} />
          </button>
          {panel && (
            <div className="mp-popover">
              {panel === "notifications" && (
                <>
                  <h3>{t("운영 알림")}</h3>
                  <p>{t("확인이 필요한 업무를 모았어요.")}</p>
                  <Link
                    href={navigate(
                      isBusiness
                        ? "/biz/orders"
                        : "/admin/shops?status=pending",
                    )}
                  >
                    <Store size={18} />
                    <span>
                      {isBusiness ? t("접수 대기 주문") : t("승인 대기 업체")}{" "}
                      <b>{counts.pending}{t("건")}</b>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href={navigate(isBusiness ? "/biz/chat" : "/admin/reports")}
                  >
                    <Flag size={18} />
                    <span>
                      {isBusiness ? t("읽지 않은 채팅") : t("미처리 신고")}{" "}
                      <b>{counts.reports}{t("건")}</b>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                </>
              )}
              {panel === "help" && (
                <>
                  <h3>{t("관리자 이용 가이드")}</h3>
                  <p>
                    {isBusiness
                      ? t("업체 프로필을 완성하고 상품·서비스를 등록해 보세요. 주문과 고객 채팅을 이곳에서 관리할 수 있습니다.")
                      : t("업체 정보를 검토하고 승인하면 서비스에 공개됩니다. 반려 시 사유가 업체에 전달됩니다.")}
                  </p>
                  <Link
                    href={navigate(
                      isBusiness
                        ? "/biz/profile"
                        : "/admin/shops?status=pending",
                    )}
                  >
                    <ShieldCheck size={18} />
                    {isBusiness ? t("업체 프로필 완성하기") : t("업체 승인하러 가기")}
                    <ChevronRight size={16} />
                  </Link>
                  <Link href="/terms" target="_blank">
                    <BookOpen size={18} />
                    {t("서비스 운영 정책")}
                    <ArrowUpRight size={16} />
                  </Link>
                </>
              )}
              {panel === "profile" && (
                <>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <Link href={navigate("/profile")}>
                    <Users size={17} />{t("내 프로필")}
                    <ChevronRight size={15} />
                  </Link>
                  {!preview && (
                    <button
                      onClick={async () => {
                        await logout();
                        router.replace("/login");
                      }}
                    >
                      <LogOut size={17} />
                      {t("로그아웃")}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </header>
      {mobileOpen && (
        <button
          className="mp-sidebar-backdrop"
          aria-label={t("메뉴 닫기")}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`mp-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="mp-workspace">
          <div className="mp-workspace-icon">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <b className="mp-workspace-name">
              {business?.shop.name ?? "Mongpass"}
            </b>
            <span>{business ? `${t(CATEGORY_KO[business.shop.category])} · ${t("비즈프로필")}` : t("최고관리자")}</span>
          </div>
          <ShieldCheck size={16} />
        </div>
        {business ? (
          <Link
            href={navigate(
              `/category/${business.shop.category}/${business.shop.id}`,
            )}
            target="_blank"
            className="mp-btn mp-btn-small"
            style={{ margin: "0 6px" }}
          >
            {t("내 업체 미리보기")} <ArrowUpRight size={13} />
          </Link>
        ) : (
          <form
            className="mp-sidebar-search"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(
                navigate("/admin/shops?q=" + encodeURIComponent(search)),
              );
            }}
          >
            <Search size={15} />
            <input
              aria-label={t("업체 검색")}
              placeholder={t("업체 검색")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>↵</kbd>
          </form>
        )}
        <nav className="mp-side-nav" aria-label={t("관리자 메뉴")}>
          {sections.map(({ href, label, icon: Icon, group }) => (
            <div key={href}>
              {group && <p className="mp-nav-group">{group}</p>}
              <Link
                href={navigate(href)}
                aria-current={currentPath === href ? "page" : undefined}
                className={currentPath === href ? "active" : ""}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {(href === "/admin/shops" || href === "/biz/orders") &&
                  counts.pending > 0 && (
                    <b className="mp-nav-count">{counts.pending}</b>
                  )}
                {(href === "/admin/reports" || href === "/biz/chat") &&
                  counts.reports > 0 && (
                    <b className="mp-nav-count">{counts.reports}</b>
                  )}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mp-sidebar-footer">
          {isBusiness ? (
            <button className="mp-sidebar-help" onClick={() => setPanel("help")}>
              <CircleHelp size={14} /> {t("이용 가이드 · 문의")}
            </button>
          ) : (
            <><span className="mp-live-dot" /> {t("함께 연결되는 일상")}</>
          )}
          <p>© {new Date().getFullYear()} Mongpass</p>
        </div>
      </aside>
      <main id="admin-main" className="mp-main" ref={mainRef}>
        <div className="mp-breadcrumb">
          <span>{isBusiness ? t("업체 관리자") : t("최고관리자")}</span>
          <ChevronRight size={13} />
          <b>
            {activeSection?.label ?? (isBusiness ? t("업체 홈") : t("관리자 홈"))}
          </b>
          {preview && (
            <span className="mp-preview-badge">{t("샘플 데이터 · 미리보기")}</span>
          )}
        </div>
        {notice}
        <div className="mp-content">
          {children}
          <footer className="mp-page-footer">
            <span>{t("한국과 몽골, 더 가까운 일상을 만듭니다.")}</span>
            <span>Mongpass Business</span>
          </footer>
        </div>
      </main>
      {business && <BusinessMobileNav shop={business.shop} pending={business.pending} unread={business.unread} preview={preview} />}
    </div>
    </AdminLanguage.Provider>
  );
}
