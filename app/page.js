'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingProgress(0);

    try {
      setLoadingText('Читаю текст с этикетки...');
      const ocrResult = await Tesseract.recognize(image, 'rus+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setLoadingProgress(Math.round(m.progress * 80));
          }
        },
      });

      const text = ocrResult.data.text.trim();
      if (!text || text.length < 10) {
        throw new Error('Не удалось прочитать текст. Попробуй сфотографировать чётче — этикетка должна быть в фокусе.');
      }

      setLoadingText('Анализирую состав...');
      setLoadingProgress(85);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка анализа');
      setLoadingProgress(100);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingText('');
      setLoadingProgress(0);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getScore = (score) => {
    if (score >= 8) return { color: 'var(--accent-green)', bg: 'var(--accent-green-light)', label: 'Отлично', emoji: '✦' };
    if (score >= 6) return { color: '#4A7C59', bg: '#E8F5EC', label: 'Хорошо', emoji: '✦' };
    if (score >= 4) return { color: 'var(--accent-yellow)', bg: 'var(--accent-yellow-light)', label: 'Средне', emoji: '◆' };
    if (score >= 2) return { color: 'var(--accent-orange)', bg: 'var(--accent-orange-light)', label: 'Плохо', emoji: '▼' };
    return { color: 'var(--accent-red)', bg: 'var(--accent-red-light)', label: 'Вредно', emoji: '✕' };
  };

  const scoreData = result ? getScore(result.score) : null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: '40px' }}>

      {/* Header */}
      <header style={{
        padding: '20px 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <div>
          <div className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Состав
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
            анализ продуктов питания
          </div>
        </div>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--text-primary)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>🔬</div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px 0' }}>

        {/* Upload screen */}
        {!image && !result && (
          <div className="animate-fade-up">
            {/* Hero card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--text-primary)',
                borderRadius: 'var(--radius)',
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Decorative circles */}
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '160px', height: '160px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.08)',
              }} />
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.06)',
              }} />

              <div style={{
                width: '72px', height: '72px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 20px',
              }}>📷</div>

              <div className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Сфотографируй этикетку
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                Наведи камеру на состав продукта — мы скажем насколько он полезен
              </div>

              <div style={{
                marginTop: '24px',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.1px',
              }}>
                Открыть камеру →
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { icon: '📸', label: 'Фото этикетки' },
                { icon: '🔍', label: 'Читаем состав' },
                { icon: '⚡', label: 'Оценка за 10 сек' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 12px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.3' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview + analyze */}
        {image && !result && !loading && (
          <div className="animate-scale-in">
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
            }}>
              <img src={image} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '20px' }}>
                <button
                  onClick={analyze}
                  style={{
                    width: '100%',
                    background: 'var(--text-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '-0.2px',
                    fontFamily: 'inherit',
                  }}
                >
                  Анализировать состав
                </button>
                <button
                  onClick={reset}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    padding: '12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginTop: '4px',
                  }}
                >
                  Выбрать другое фото
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="animate-fade-up" style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{
              width: '80px', height: '80px',
              margin: '0 auto 24px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--border)',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'var(--text-primary)',
                animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: '16px',
                background: 'var(--bg-muted)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>🔬</div>
            </div>

            <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.3px' }}>
              {loadingText}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Это займёт несколько секунд
            </div>

            {/* Progress bar */}
            <div style={{
              background: 'var(--border)',
              borderRadius: '100px',
              height: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${loadingProgress}%`,
                background: 'var(--text-primary)',
                borderRadius: '100px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-fade-up" style={{
            background: 'var(--accent-red-light)',
            border: '1px solid #F5C6C2',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginTop: '16px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--accent-red)', lineHeight: '1.5' }}>
              ⚠ {error}
            </div>
            <button onClick={reset} style={{
              marginTop: '10px',
              background: 'var(--accent-red)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Попробовать снова
            </button>
          </div>
        )}

        {/* Result */}
        {result && scoreData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Score card */}
            <div className="animate-fade-up" style={{
              background: scoreData.bg,
              borderRadius: 'var(--radius)',
              padding: '28px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: scoreData.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  {scoreData.label}
                </div>
                <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.4', letterSpacing: '-0.2px' }}>
                  {result.verdict}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: '56px', fontWeight: 800, color: scoreData.color, lineHeight: 1, letterSpacing: '-2px' }}>
                  {result.score}
                </div>
                <div style={{ fontSize: '12px', color: scoreData.color, opacity: 0.7, fontWeight: 500 }}>из 10</div>
              </div>
            </div>

            {/* Ingredients */}
            {result.ingredients?.length > 0 && (
              <div className="animate-fade-up stagger-1" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                  Ключевые ингредиенты
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {result.ingredients.map((item, i) => {
                    const colors = {
                      bad: { dot: 'var(--accent-red)', bg: 'var(--accent-red-light)' },
                      ok: { dot: 'var(--accent-yellow)', bg: 'var(--accent-yellow-light)' },
                      good: { dot: 'var(--accent-green)', bg: 'var(--accent-green-light)' },
                    };
                    const c = colors[item.type] || colors.ok;
                    return (
                      <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '8px', height: '8px',
                          borderRadius: '50%',
                          background: c.dot,
                          flexShrink: 0,
                          marginTop: '5px',
                        }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.5' }}>
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full composition */}
            {result.composition && (
              <div className="animate-fade-up stagger-2" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                  Полный состав
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  {result.composition}
                </div>
              </div>
            )}

            {/* Scan again */}
            <div className="animate-fade-up stagger-3">
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  background: 'var(--text-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '-0.2px',
                  fontFamily: 'inherit',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                Сканировать ещё
              </button>
            </div>
          </div>
        )}

      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
