"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import Sidebar from "@/components/Sidebar";
import { Activity, Zap, Thermometer, ArrowUpRight, ArrowDownRight, RefreshCw, Power } from "lucide-react";

export default function Inversores() {
  const [inverters, setInverters] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const router = useRouter();

  const fetchInverters = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/inverters');
      const data = await res.json();
      if (data.inverters) {
        setInverters(data.inverters.map((inv: any) => ({
          id: inv.id,
          name: inv.plant_name || inv.plant,
          status: inv.status,
          power: inv.power ? `${inv.power} kW` : '-- kW',
          voltage: inv.voltage ? `${inv.voltage} V` : '-- V',
          current: inv.current ? `${inv.current} A` : '-- A',
          temperature: inv.temperature ? `${inv.temperature} ºC` : '-- ºC',
          efficiency: inv.efficiency ? `${inv.efficiency}%` : '-- %',
          generation_today: inv.generation_today ?? '--',
          generation_month: inv.generation_month ?? '--',
          economy_month: inv.economy_month ?? '--',
          economy_today: inv.economy_today ?? '--',
          lastUpdate: inv.updated_at ? new Date(inv.updated_at).toLocaleTimeString('pt-BR') : 'Agora mesmo'
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar inversores:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInverters();
    const interval = setInterval(fetchInverters, 5000); // Realtime a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchInverters();
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Monitoramento de Inversores</h1>
            <p style={{ color: '#a1a1aa', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Acompanhamento em tempo real da performance, tensão e temperatura de cada string.
            </p>
          </div>
          <button 
            className={`${styles.refreshBtn} ${isRefreshing ? styles.spinning : ''}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={18} />
            Sincronizar Agora
          </button>
        </header>

        <section className={styles.content}>
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Nota sobre usinas da SolarZ</strong>
              A plataforma SolarZ consolida a energia diária e exibe publicamente apenas os dados do dia anterior. Portanto, os cards dessas usinas exibirão <strong>"Ontem"</strong> em vez de "Hoje", enquanto a potência instantânea continua em tempo real.
            </div>
          </div>
          
          <div className={styles.invertersGrid}>
            {inverters.map((inv) => (
              <div key={inv.id} className={`${styles.inverterCard} ${styles[inv.status]}`}>
                <div className={styles.invHeader}>
                  <div className={styles.invTitleArea}>
                    <div className={`${styles.statusDot} ${styles[`dot_${inv.status}`]}`}></div>
                    <h3 className={styles.invName}>{inv.name}</h3>
                  </div>
                  <span className={styles.invPower}>
                    <Activity size={16} />
                    {inv.power}
                  </span>
                </div>

                <div className={styles.invMetricsGrid}>
                  <div className={styles.invMetric}>
                    <span className={styles.metricLabel}><Zap size={14} /> Tensão</span>
                    <span className={styles.metricValue}>{inv.voltage}</span>
                  </div>
                  <div className={styles.invMetric}>
                    <span className={styles.metricLabel}><ArrowUpRight size={14} /> Corrente</span>
                    <span className={styles.metricValue}>{inv.current}</span>
                  </div>
                  <div className={styles.invMetric}>
                    <span className={styles.metricLabel}><Power size={14} /> {inv.id.startsWith('SZ-') ? 'Ontem (kWh)' : 'Hoje (kWh)'}</span>
                    <span className={styles.metricValue}>{inv.generation_today}</span>
                  </div>
                  <div className={styles.invMetric}>
                    <span className={styles.metricLabel}><Power size={14} /> Mês (kWh)</span>
                    <span className={styles.metricValue}>{inv.generation_month}</span>
                  </div>
                  <div className={styles.invMetric}>
                    <span className={styles.metricLabel} style={{color: '#24b47e'}}>💲 Economia Mês</span>
                    <span className={styles.metricValue} style={{color: '#24b47e'}}>R$ {inv.economy_month !== '--' ? parseFloat(inv.economy_month).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '--'}</span>
                  </div>
                </div>

                <div className={styles.invFooter}>
                  <span className={styles.lastUpdate}>Ultima atualização: {inv.lastUpdate}</span>
                  <button 
                    className={styles.detailsBtn}
                    onClick={() => {
                      if (inv.id.startsWith('SZ-')) {
                        const uuid = inv.id.replace('SZ-', '');
                        window.open(`https://app.solarz.com.br/pages/shareable/usina/${uuid}`, '_blank');
                      } else {
                        router.push(`/usina/${inv.id}`);
                      }
                    }}
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
