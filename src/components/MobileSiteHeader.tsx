"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteBrandLogo } from "@/components/SiteBrandLogo";
import { LanguagePageLinks } from "@/components/LanguagePageLinks";
import { HeaderCreditPill } from "@/components/HeaderCreditPill";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";
import { useAuth } from "@/components/auth/AuthProvider";
import { mobileNavigationLinks, showMobileSiteHeader } from "@/lib/mobile-navigation";
import styles from "./MobileSiteHeader.module.css";

export function MobileSiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const visible = showMobileSiteHeader(pathname);
  function closeMenu() { dialog.current?.close(); setOpen(false); }
  function openMenu() { if (dialog.current && !dialog.current.open) { dialog.current.showModal(); setOpen(true); } }
  useEffect(() => { dialog.current?.close(); setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const resize = () => { if (desktop.matches) { dialog.current?.close(); setOpen(false); } };
    desktop.addEventListener("change", resize);
    return () => desktop.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  if (!visible) return null;
  return <>
    <header id="crelavo-mobile-header" className={styles.header} aria-label="Crelavo mobile navigation">
      <Link className={styles.brand} href="/" aria-label="Crelavo home"><SiteBrandLogo compact /></Link>
      <div className={styles.actions}>{user && <div className={styles.account}><AuthHeaderControls /></div>}<button className={styles.menuButton} type="button" aria-label="Open menu" aria-haspopup="dialog" aria-controls="crelavo-mobile-menu" aria-expanded={open} onClick={openMenu}><span aria-hidden="true">☰</span></button></div>
    </header>
    <dialog id="crelavo-mobile-menu" ref={dialog} className={styles.drawer} aria-labelledby="crelavo-mobile-menu-title" onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className={styles.drawerContent}>
        <div className={styles.drawerHeading}><h2 id="crelavo-mobile-menu-title">Menu</h2><button className={styles.closeButton} type="button" aria-label="Close menu" onClick={closeMenu}>Close</button></div>
        <div className={styles.credits}><HeaderCreditPill /></div>
        <nav className={styles.links} aria-label="Mobile menu">{mobileNavigationLinks.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={closeMenu}>{link.label}</Link>)}</nav>
        <div className={styles.languages} aria-label="Language pages"><LanguagePageLinks /></div>
        <div className={styles.drawerAccount}><AuthHeaderControls /></div>
      </div>
    </dialog>
  </>;
}
