"use client";

import styles from "../page.module.css";
import Sidebar from "@/components/Sidebar";

export default function Configuracoes() {
  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Configurações</h1>
            <p style={{ color: '#a1a1aa', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Gerencie suas chaves de API, notificações e integrações.
            </p>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.card} style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>Integração iSolarCloud</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>AppKey</label>
                <input 
                  type="password" 
                  value="************************"
                  readOnly
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>Chave de Acesso Pessoal</label>
                <input 
                  type="password" 
                  value="************************"
                  readOnly
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <button style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', background: '#24b47e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}>
                Atualizar Credenciais
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
