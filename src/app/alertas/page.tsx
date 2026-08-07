"use client";

import styles from "../page.module.css";
import Sidebar from "@/components/Sidebar";
import { AlertTriangle, ShieldCheck, Zap, Cpu, CheckCircle2, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function Alertas() {
  const [inverters, setInverters] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApiData() {
      try {
        const invRes = await fetch('/api/inverters');
        const invData = await invRes.json();
        if (invData.inverters) setInverters(invData.inverters);
        
        const logsRes = await fetch('/api/ai/logs');
        const logsData = await logsRes.json();
        if (logsData.logs) setAiLogs(logsData.logs);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchApiData();
    const interval = setInterval(fetchApiData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalInverters = inverters.length;
  const analisesHoje = aiLogs.length; // Cada log pode ser considerado uma análise para simplificar
  const anomalias = aiLogs.filter(log => log.type === 'alert' || log.type === 'warning').length;

  return (
    <div className={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>IA & Alertas</h1>
            <p style={{ color: '#a1a1aa', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Diagnósticos inteligentes e previsão de falhas gerados pelo AI Agent.
            </p>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><ShieldCheck size={20} style={{ color: '#24b47e' }}/> Status do Sistema IA</h2>
            </div>
            <div className={styles.cardBody}>
              <p style={{ color: '#ededed', fontSize: '1.1rem', marginBottom: '1rem' }}>
                O Agente IA está ativo e analisando {totalInverters} inversores simultaneamente.
              </p>
              <div style={{ display: 'flex', gap: '2rem' }}>
                 <div>
                    <span style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ações / Registros Hoje</span>
                    <strong style={{ fontSize: '1.5rem', color: '#24b47e' }}>{analisesHoje}</strong>
                 </div>
                 <div>
                    <span style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Anomalias Detectadas</span>
                    <strong style={{ fontSize: '1.5rem', color: '#ef4444' }}>{anomalias}</strong>
                 </div>
              </div>
            </div>
          </div>
          
          <div className={styles.summaryCard} style={{ marginTop: '1.5rem' }}>
            <div className={styles.cardHeader}>
               <h2 className={styles.cardTitle}><AlertTriangle size={20} style={{ color: '#eab308' }}/> Últimos Alertas</h2>
            </div>
            <div className={styles.logList} style={{ maxHeight: 'none', overflowY: 'visible', gap: '1.2rem', marginTop: '1rem' }}>
                {loading ? (
                  <div style={{ color: '#71717a' }}>Carregando dados...</div>
                ) : aiLogs.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: '0.95rem' }}>
                    Nenhum alerta ou evento crítico registrado no momento. Tudo operando normalmente.
                  </div>
                ) : (
                  aiLogs.map((log, index) => {
                    const isAlert = log.type === 'alert' || log.type === 'warning';
                    const iconColor = isAlert ? '#ef4444' : '#24b47e';
                    const bgClass = isAlert ? 'rgba(239, 68, 68, 0.05)' : 'rgba(36, 180, 126, 0.05)';
                    const borderClass = isAlert ? '3px solid #ef4444' : '3px solid #24b47e';
                    
                    return (
                      <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: bgClass, padding: '1rem', borderRadius: '8px', borderLeft: borderClass }}>
                        {isAlert ? <AlertTriangle size={24} color={iconColor} /> : <CheckCircle2 size={24} color={iconColor} />}
                        <div>
                            <strong style={{ display: 'block', color: '#fff', marginBottom: '0.2rem' }}>{log.type.toUpperCase()}</strong>
                            <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{log.message}</span>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#71717a', fontSize: '0.8rem' }}>
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    );
                  })
                )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
