"use client";
import styles from "./Sidebar.module.css";
import { Sun, LayoutDashboard, Activity, Cpu, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <Sun size={26} className={styles.sunIcon} />
          {!isCollapsed && <span className={styles.brandText}>LacerdaSolar</span>}
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className={styles.toggleBtn}>
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <LayoutDashboard size={18} />
          {!isCollapsed && <span className={styles.navLabel}>Visão Geral</span>}
        </Link>
        <Link href="/inversores" className={`${styles.navItem} ${pathname === '/inversores' ? styles.active : ''}`}>
          <Activity size={18} />
          {!isCollapsed && <span className={styles.navLabel}>Inversores</span>}
        </Link>
        <Link href="/alertas" className={`${styles.navItem} ${pathname === '/alertas' ? styles.active : ''}`}>
          <Cpu size={18} />
          {!isCollapsed && <span className={styles.navLabel}>IA & Alertas</span>}
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={`${styles.agentStatus} ${isCollapsed ? styles.agentCollapsed : ''}`}>
          <div className={styles.agentStatusIcon}></div>
          {!isCollapsed && (
            <div className={styles.agentTextContainer}>
              <span className={styles.agentLabel}>AI Agent</span>
              <span className={styles.agentState}>Monitorando 24/7</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
