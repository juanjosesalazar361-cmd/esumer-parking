function SideCar({ color, className }) {
  return (
    <div className={`bd-car ${className}`}>
      <svg viewBox="0 0 120 48" width="110" height="44" style={{ overflow: 'visible' }}>
        <polygon points="116,28 190,12 190,46" fill="#ffe9a6" opacity=".07" />
        <path d="M6 32 Q6 24 16 22 L34 20 Q42 8 58 8 L80 8 Q92 10 98 20 L110 23 Q116 26 116 32 L116 36 L6 36 Z" fill={color} />
        <path d="M40 20 Q46 12 58 12 L66 12 L66 20 Z" fill="#0d1117" opacity=".8" />
        <path d="M70 12 L80 12 Q88 14 92 20 L70 20 Z" fill="#0d1117" opacity=".8" />
        <circle cx="30" cy="37" r="8" fill="#0b0d10" /><circle cx="30" cy="37" r="3.5" fill="#566073" />
        <circle cx="92" cy="37" r="8" fill="#0b0d10" /><circle cx="92" cy="37" r="3.5" fill="#566073" />
        <rect x="110" y="26" width="6" height="4" rx="1" fill="#ffe9a6" />
      </svg>
    </div>
  );
}

// Fondo animado: luces, cuadrícula, letreros P y una carretera con carros.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bd-glow g1" /><div className="bd-glow g2" /><div className="bd-glow g3" />
      <div className="bd-grid" />
      {['6%', '24%', '47%', '68%', '90%'].map((left, i) => <span key={left} className="bd-p" style={{ left, animationDelay: `${-i * 4.2}s` }}>P</span>)}
      <div className="bd-road">
        <div className="bd-lane" />
        <SideCar color="#c0392b" className="r a" />
        <SideCar color="#2c7fb8" className="r b" />
        <SideCar color="#ecf0f1" className="l a" />
        <SideCar color="#e1b12c" className="l b" />
      </div>
    </div>
  );
}