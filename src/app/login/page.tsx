"use client";

import styles from "./login.module.css";
import { Sun, ArrowRight, Lock, Mail, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "../../utils/supabase/client";

export default function Login() {
  const router = useRouter();
  const [animKey, setAnimKey] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 10000); // Reinicia a animação a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className={styles.container}>
      {/* Painel Esquerdo (Apresentação) */}
      <div className={styles.leftPanel}>
        <div className={styles.brand}>
          <Sun size={26} className={styles.sunIcon} />
          LacerdaSolar
        </div>
        
        <h1 className={styles.heroTitle}>
          O cérebro da sua<br />usina solar.
        </h1>
        
        <p className={styles.heroSubtitle}>
          Detecte anomalias silenciosas, otimize o rendimento e evite paradas 
          inesperadas com monitoramento inteligente operando 24/7.
        </p>

        <div className={styles.mockupCard}>
          <div className={styles.mockupHeader}>
            <div className={`${styles.dot} ${styles.red}`}></div>
            <div className={`${styles.dot} ${styles.yellow}`}></div>
            <div className={`${styles.dot} ${styles.green}`}></div>
          </div>
          <div className={styles.mockupCode} key={animKey}>
            <div className={styles.typingLine} style={{ animationDelay: '0.5s' }}>
              <span className={styles.codeComment}>// 1. Conecte sua usina à IA</span>
            </div>
            <div className={styles.typingLine} style={{ animationDelay: '1.5s' }}>
              <span className={styles.codeKeyword}>import</span> {'{'} LacerdaSolar {'}'} <span className={styles.codeKeyword}>from</span> <span className={styles.codeString}>"@lacerdasolar/ai"</span>;
            </div>
            <br />
            <div className={styles.typingLine} style={{ animationDelay: '2.5s' }}>
              <span className={styles.codeComment}>// 2. Inicialize a detecção de anomalias</span>
            </div>
            <div className={styles.typingLine} style={{ animationDelay: '3.5s' }}>
              <span className={styles.codeKeyword}>const</span> monitor = <span className={styles.codeKeyword}>new</span> LacerdaSolar();
            </div>
            <div className={styles.typingLine} style={{ animationDelay: '4.2s' }}>
              monitor.trackInverters();
            </div>
            <br />
            <div className={styles.typingLine} style={{ animationDelay: '5s' }}>
              <span className={styles.codeKeyword}>await</span> monitor.listenForAnomalies((alert) ={'>'} {'{'}
            </div>
            <div className={styles.typingLine} style={{ animationDelay: '5.8s' }}>
              &nbsp;&nbsp;whatsapp.sendAlert(alert.message);
            </div>
            <div className={styles.typingLine} style={{ animationDelay: '6.5s' }}>
              {'}'});
            </div>
            <div className={`${styles.cursor} ${styles.blinkingCursor}`}></div>
          </div>
        </div>
      </div>

      {/* Painel Direito (Formulário) */}
      <div className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <h2 className={styles.cardTitle}>Acessar a conta</h2>
          <p className={styles.cardSubtitle}>Preencha suas credenciais para visualizar o painel.</p>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">E-mail corporativo</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input 
                  type="email" 
                  id="email" 
                  className={styles.input} 
                  placeholder="admin@solaray.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.headerRow}>
                <label className={styles.label} htmlFor="password">Senha de acesso</label>
                <Link href="#" className={styles.forgotPassword}>Esqueceu a senha?</Link>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input 
                  type="password" 
                  id="password" 
                  className={styles.input} 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Eye size={16} className={styles.inputIcon} style={{ left: 'auto', right: '0.75rem', cursor: 'pointer' }} />
              </div>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? "Autenticando..." : "Entrar no painel"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className={styles.divider}>
            ou acessar via SSO
          </div>

          <button type="button" className={styles.ssoButton}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
              <path d="M11 22v-4a4.8 4.8 0 0 0-1-3.02"></path>
            </svg>
            Continuar com GitHub
          </button>

          <p className={styles.footerText}>
            Não possui acesso corporativo? <Link href="#">Falar com suporte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
