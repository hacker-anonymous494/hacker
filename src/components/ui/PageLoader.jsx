import { useEffect, useState } from 'react'

export default function PageLoader() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0) // 0: ignite, 1: burn, 2: glow

  useEffect(() => {
    // Progress bar simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        const increment = p < 60 ? Math.random() * 8 : Math.random() * 3
        return Math.min(p + increment, 98)
      })
    }, 120)

    // Phase transitions
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1200)

    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="page-loader">
      {/* Ambient background */}
      <div className="loader-bg" />
      <div className="loader-noise" />

      {/* Ember particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`ember ember-${i}`} />
      ))}

      {/* Central content */}
      <div className={`loader-core phase-${phase}`}>

        {/* Flame SVG */}
        <div className="flame-wrap">
          <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="flame-svg">
            {/* Outer flame */}
            <path
              className="flame-outer"
              d="M30 78C30 78 6 62 6 38C6 22 16 12 22 6C22 6 18 22 26 28C26 28 20 14 32 6C32 6 28 20 36 26C36 26 42 16 40 6C40 6 54 18 54 38C54 62 30 78 30 78Z"
            />
            {/* Mid flame */}
            <path
              className="flame-mid"
              d="M30 68C30 68 14 55 14 40C14 29 20 22 24 17C24 17 22 28 28 33C28 33 24 24 32 18C32 18 30 28 36 32C36 32 40 25 38 18C38 18 46 27 46 40C46 55 30 68 30 68Z"
            />
            {/* Inner core */}
            <path
              className="flame-inner"
              d="M30 56C30 56 20 47 20 38C20 31 24 26 27 23C27 23 26 31 29 34C29 34 27 29 31 24C31 24 30 31 33 34C33 34 36 29 35 23C35 23 40 30 40 38C40 47 30 56 30 56Z"
            />
          </svg>

          {/* Glow beneath flame */}
          <div className="flame-glow" />
        </div>

        {/* Wordmark */}
        <div className="loader-wordmark">
          <span className="loader-est">Est. 2025</span>
          <h1 className="loader-title">Veranda</h1>
          <div className="loader-divider">
            <span className="divider-line" />
            <span className="divider-diamond">◆</span>
            <span className="divider-line" />
          </div>
          <p className="loader-sub">Wood-fired & handcrafted</p>
        </div>

        {/* Progress bar */}
        <div className="loader-progress-wrap">
          <div className="loader-progress-track">
            <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
            <div className="loader-progress-shimmer" style={{ left: `${progress - 8}%` }} />
          </div>
        </div>
      </div>

      <style>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0a0908;
        }

        .loader-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 70%, rgba(180,70,10,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(251,146,60,0.08) 0%, transparent 60%),
            #0a0908;
        }

        .loader-noise {
          position: absolute;
          inset: 0;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Ember particles */
        .ember {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #f97316;
          box-shadow: 0 0 6px 2px rgba(249,115,22,0.6);
          animation: emberFloat linear infinite;
          opacity: 0;
        }

        .ember-0  { left: 46%; animation-duration: 3.2s; animation-delay: 0.1s; width: 2px; height: 2px; }
        .ember-1  { left: 52%; animation-duration: 2.8s; animation-delay: 0.5s; }
        .ember-2  { left: 49%; animation-duration: 3.6s; animation-delay: 0.9s; background: #fbbf24; }
        .ember-3  { left: 44%; animation-duration: 2.5s; animation-delay: 1.3s; width: 2px; height: 2px; }
        .ember-4  { left: 55%; animation-duration: 3.1s; animation-delay: 0.3s; background: #fbbf24; }
        .ember-5  { left: 48%; animation-duration: 4.0s; animation-delay: 0.7s; width: 4px; height: 4px; }
        .ember-6  { left: 51%; animation-duration: 2.9s; animation-delay: 1.7s; }
        .ember-7  { left: 47%; animation-duration: 3.4s; animation-delay: 2.1s; width: 2px; height: 2px; }
        .ember-8  { left: 53%; animation-duration: 2.7s; animation-delay: 0.6s; background: #ef4444; }
        .ember-9  { left: 43%; animation-duration: 3.8s; animation-delay: 1.1s; }
        .ember-10 { left: 57%; animation-duration: 3.0s; animation-delay: 1.9s; width: 2px; height: 2px; }
        .ember-11 { left: 50%; animation-duration: 2.6s; animation-delay: 0.4s; background: #fbbf24; }

        @keyframes emberFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; bottom: 52%; }
          10%  { opacity: 0.9; }
          50%  { transform: translateY(-80px) translateX(calc(var(--dx, 12px) * 1)) scale(0.8); opacity: 0.7; }
          100% { transform: translateY(-180px) translateX(calc(var(--dx, 20px) * 2)) scale(0.2); opacity: 0; bottom: 52%; }
        }

        .ember-0  { --dx: -18px; }
        .ember-1  { --dx:  14px; }
        .ember-2  { --dx: -8px;  }
        .ember-3  { --dx:  22px; }
        .ember-4  { --dx: -24px; }
        .ember-5  { --dx:  6px;  }
        .ember-6  { --dx: -16px; }
        .ember-7  { --dx:  18px; }
        .ember-8  { --dx: -10px; }
        .ember-9  { --dx:  28px; }
        .ember-10 { --dx: -20px; }
        .ember-11 { --dx:  12px; }

        /* Core container */
        .loader-core {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .loader-core.phase-1,
        .loader-core.phase-2 {
          opacity: 1;
          transform: translateY(0);
        }

        /* Flame */
        .flame-wrap {
          position: relative;
          width: 64px;
          height: 84px;
          margin-bottom: -4px;
        }

        .flame-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 18px rgba(249,115,22,0.7)) drop-shadow(0 0 40px rgba(234,88,12,0.4));
        }

        .flame-outer {
          fill: url(#flameOuter);
          animation: flameWobble 1.8s ease-in-out infinite alternate;
          transform-origin: 30px 78px;
        }

        .flame-mid {
          fill: url(#flameMid);
          animation: flameWobble 1.3s ease-in-out infinite alternate-reverse;
          transform-origin: 30px 68px;
        }

        .flame-inner {
          fill: url(#flameInner);
          animation: flameWobble 0.9s ease-in-out infinite alternate;
          transform-origin: 30px 56px;
        }

        @keyframes flameWobble {
          0%   { transform: scaleX(1) scaleY(1); }
          33%  { transform: scaleX(0.94) scaleY(1.03); }
          66%  { transform: scaleX(1.05) scaleY(0.97); }
          100% { transform: scaleX(0.97) scaleY(1.04); }
        }

        .flame-glow {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 16px;
          background: radial-gradient(ellipse, rgba(251,146,60,0.5) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 1.6s ease-in-out infinite alternate;
        }

        @keyframes glowPulse {
          from { opacity: 0.6; transform: translateX(-50%) scaleX(0.9); }
          to   { opacity: 1.0; transform: translateX(-50%) scaleX(1.15); }
        }

        /* Wordmark */
        .loader-wordmark {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 28px;
        }

        .loader-est {
          font-family: 'Georgia', serif;
          font-size: 10px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(251,146,60,0.7);
          opacity: 0;
          animation: fadeSlideUp 0.5s ease forwards 0.6s;
        }

        .loader-title {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: clamp(2.8rem, 8vw, 4.5rem);
          font-weight: 400;
          letter-spacing: 0.08em;
          color: #faf5f0;
          margin: 0;
          line-height: 1;
          opacity: 0;
          animation: fadeSlideUp 0.6s ease forwards 0.75s;
          text-shadow: 0 0 60px rgba(251,146,60,0.25);
        }

        .loader-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          opacity: 0;
          animation: fadeSlideUp 0.5s ease forwards 0.9s;
        }

        .divider-line {
          display: block;
          width: 48px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,146,60,0.5), transparent);
        }

        .divider-diamond {
          font-size: 7px;
          color: rgba(251,146,60,0.7);
        }

        .loader-sub {
          font-family: 'Georgia', serif;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(200,180,160,0.55);
          margin: 0;
          opacity: 0;
          animation: fadeSlideUp 0.5s ease forwards 1.05s;
        }

        /* Progress */
        .loader-progress-wrap {
          width: 180px;
          opacity: 0;
          animation: fadeSlideUp 0.5s ease forwards 1.2s;
        }

        .loader-progress-track {
          position: relative;
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.08);
          border-radius: 1px;
          overflow: hidden;
        }

        .loader-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(251,146,60,0.4), #f97316);
          border-radius: 1px;
          transition: width 0.18s ease;
          box-shadow: 0 0 8px rgba(249,115,22,0.8);
        }

        .loader-progress-shimmer {
          position: absolute;
          top: -1px;
          width: 16px;
          height: 3px;
          background: radial-gradient(ellipse, rgba(255,220,150,0.9) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Inline SVG defs via style — injected through a hidden element trick */
      `}</style>

      {/* SVG gradient defs (hidden, referenced by flame paths) */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="flameOuter" x1="30" y1="6" x2="30" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="45%"  stopColor="#f97316" stopOpacity="1"   />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="flameMid" x1="30" y1="17" x2="30" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#fde68a" stopOpacity="1"   />
            <stop offset="50%"  stopColor="#fb923c" stopOpacity="1"   />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="flameInner" x1="30" y1="23" x2="30" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#fef9c3" stopOpacity="1"   />
            <stop offset="60%"  stopColor="#fde68a" stopOpacity="1"   />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}