"use client";
import styles from "./Sidebar.module.css";
import { Sun, LayoutDashboard, Activity, Cpu, Settings, ChevronLeft, ChevronRight, Menu, X, Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logsRes = await fetch('/api/ai/logs');
        const logsData = await logsRes.json();
        if (logsData.logs) setAiLogs(logsData.logs);
      } catch (e) {}
    }
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button 
        className={styles.mobileMenuBtn} 
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={24} />
      </button>

      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)}></div>
      )}

      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <Sun size={26} className={styles.sunIcon} />
            {!isCollapsed && <span className={styles.brandText}>LacerdaSolar</span>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={styles.toggleBtn}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          
          <button className={styles.mobileCloseBtn} onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <LayoutDashboard size={18} />
          {!isCollapsed && <span className={styles.navLabel}>Visão Geral</span>}
        </Link>
        <Link href="/inversores" className={`${styles.navItem} ${pathname === '/inversores' ? styles.active : ''}`}>
          <Activity size={18} />
          {!isCollapsed && <span className={styles.navLabel}>Usinas</span>}
        </Link>
        <Link href="/alertas" className={`${styles.navItem} ${pathname === '/alertas' ? styles.active : ''}`}>
          <Cpu size={18} />
          {!isCollapsed && <span className={styles.navLabel}>IA & Alertas</span>}
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={`${styles.userSection} ${isCollapsed ? styles.userCollapsed : ''}`}>
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button 
              className={styles.iconButton} 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setHasViewedNotifications(true);
              }}
            >
              <Bell size={20} />
              {aiLogs.length > 0 && !hasViewedNotifications && <span className={styles.notificationDot}></span>}
            </button>
            
            {isNotificationsOpen && (
              <div className={styles.notificationsDropdown}>
                <div className={styles.notificationsHeader}>
                  Notificações IA
                </div>
                <div className={styles.notificationsBody}>
                  {aiLogs.length === 0 ? (
                    <div className={styles.noNotifications}>Nenhuma notificação</div>
                  ) : (
                    aiLogs.slice(0, 5).map((log, i) => (
                      <Link href="/alertas" key={i} className={styles.notificationItem} onClick={() => setIsNotificationsOpen(false)}>
                        <div className={`${styles.logIcon} ${styles[log.type]}`}>
                          {log.type === 'alert' && <AlertTriangle size={14} />}
                          {log.type === 'action' && <Cpu size={14} />}
                          {log.type === 'success' && <CheckCircle2 size={14} />}
                          {log.type === 'warning' && <AlertTriangle size={14} />}
                        </div>
                        <div className={styles.notificationText}>
                          <p className={styles.notificationMsg}>{log.message}</p>
                          <span className={styles.notificationTime}>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/alertas" className={styles.viewAllBtn}>
                  Ver todos os alertas
                </Link>
              </div>
            )}
          </div>
          
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>RL</div>
            {!isCollapsed && <span className={styles.userName}>Renato Lacerda</span>}
          </div>
        </div>

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
    </>
  );
}
