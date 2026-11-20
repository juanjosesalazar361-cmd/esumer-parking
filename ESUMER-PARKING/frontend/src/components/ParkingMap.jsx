import { useEffect, useRef, useState } from 'react';
import { ZoomOut } from 'lucide-react';

const BW = 54, BH = 86, LANE = 64, PAD = 20, SIDE = 74, COLS = 10, H = 480;
const X0 = PAD + SIDE;
const CAR_COLORS = ['#c0392b', '#2c7fb8', '#d5d8dc', '#7f8c8d', '#e1b12c', '#27ae60', '#8e44ad', '#ecf0f1'];
const COLOR_HEX = { rojo: '#c0392b', azul: '#2c7fb8', negro: '#2b2f36', blanco: '#ecf0f1', gris: '#7f8c8d', plata: '#b8c0cc', verde: '#27ae60', amarillo: '#e1b12c', naranja: '#e67e22', morado: '#8e44ad' };
const TINT = { free: '#2fbf9b', reserved: '#7c8cff', occupied: '#e5584f', maintenance: '#8b95a5' };
const LABEL = { free: 'Libre', reserved: 'Reservado', occupied: 'Ocupado', maintenance: 'En mantenimiento' };
const ZONE_NAME = { Entrada: 'ENTRADA', 'Piso 1': 'NIVEL 1', 'Piso 2': 'NIVEL 2' };
const hash = id => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
const colorOf = (name, fallback) => COLOR_HEX[(name || '').toLowerCase().trim()] || fallback;

// Calcula la posición de cada bahía: filas en pares espalda con espalda, separadas por carriles.
function layout(rows) {
  const groups = Math.ceil(rows / 2);
  const top = g => PAD + LANE + g * (2 * BH + LANE);
  const lanes = Array.from({ length: groups }, (_, g) => top(g) - LANE);
  const lastRows = rows - (groups - 1) * 2;
  const endLane = top(groups - 1) + lastRows * BH;
  lanes.push(endLane);
  return {
    lanes, gw: X0 + COLS * BW + PAD + 40, gh: endLane + LANE + PAD,
    pos: s => { const w = s.row % 2; return { x: X0 + s.col * BW, y: top(Math.floor(s.row / 2)) + w * BH, open: w === 0 ? 'up' : 'down' }; },
  };
}

function Car({ color, flip }) {
  return (
    <g transform={flip ? 'rotate(180 27 43)' : undefined}>
      <rect x="9" y="22" width="4" height="12" rx="1.5" fill="#0b0d10" /><rect x="41" y="22" width="4" height="12" rx="1.5" fill="#0b0d10" />
      <rect x="9" y="52" width="4" height="12" rx="1.5" fill="#0b0d10" /><rect x="41" y="52" width="4" height="12" rx="1.5" fill="#0b0d10" />
      <rect x="12" y="12" width="30" height="62" rx="11" fill={color} />
      <rect x="16" y="27" width="22" height="9" rx="3" fill="#0d1117" opacity=".85" />
      <rect x="17" y="37" width="20" height="15" rx="3" fill="#fff" opacity=".2" />
      <rect x="17" y="55" width="20" height="7" rx="2" fill="#0d1117" opacity=".85" />
      <rect x="15" y="14" width="7" height="3" rx="1" fill="#ffe9a6" /><rect x="32" y="14" width="7" height="3" rx="1" fill="#ffe9a6" />
      <rect x="15" y="69" width="7" height="2.5" rx="1" fill="#ff5a4d" /><rect x="32" y="69" width="7" height="2.5" rx="1" fill="#ff5a4d" />
    </g>
  );
}
function Moto({ color, flip }) {
  return (
    <g transform={flip ? 'rotate(180 27 43)' : undefined}>
      <rect x="25" y="14" width="4" height="16" rx="2" fill="#0b0d10" /><rect x="25" y="56" width="4" height="16" rx="2" fill="#0b0d10" />
      <rect x="18" y="31" width="18" height="3" rx="1.5" fill="#9aa3b0" />
      <ellipse cx="27" cy="46" rx="7" ry="13" fill={color} />
      <ellipse cx="27" cy="50" rx="5" ry="7" fill="#0d1117" opacity=".6" />
    </g>
  );
}

// Placa del vehículo reservado
function Plate({ text }) {
  return (
    <g>
      <rect x="10" y="39" width="34" height="12" rx="2" fill="#f5c542" stroke="#13171d" strokeWidth=".8" />
      <text x="27" y="48" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Sora, sans-serif" fill="#13171d">{text}</text>
    </g>
  );
}
// Vehículo reservado (con su color y placa). ghost = reserva propia que empieza más tarde.
function Booked({ v, color, up, ghost }) {
  return (
    <g opacity={ghost ? 0.55 : 1}>
      {v?.type === 'Motocicleta' ? <Moto color={colorOf(v.color, color)} flip={up} /> : <Car color={colorOf(v?.color, color)} flip={up} />}
      {v?.plate && <Plate text={v.plate} />}
      {ghost
        ? <rect x="3" y="3" width="48" height="80" rx="4" fill="none" stroke="#f5c542" strokeWidth="2" strokeDasharray="4 3" />
        : <><circle cx="44" cy="14" r="8" fill={TINT.reserved} /><text x="44" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">R</text></>}
    </g>
  );
}

function SlotArt({ s, open }) {
  const up = open === 'up', h = hash(s.id), color = CAR_COLORS[h % CAR_COLORS.length];
  const back = up ? 85 : 1;
  return (
    <svg viewBox={`0 0 ${BW} ${BH}`}>
      <rect width={BW} height={BH} fill={TINT[s.status]} opacity={s.status === 'occupied' ? 0.1 : 0.17} />
      <path d={`M1 0V${BH}M${BW - 1} 0V${BH}M0 ${back}H${BW}`} stroke="#e8ebf0" strokeOpacity=".55" strokeWidth="2" fill="none" />
      {s.status === 'occupied' && (h % 7 === 0 ? <Moto color={color} flip={up} /> : <Car color={color} flip={up} />)}
      {s.status === 'free' && !s.mine && <text x="27" y="53" textAnchor="middle" fontSize="30" fontWeight="700" fontFamily="Sora, sans-serif" fill={TINT.free} opacity=".35">P</text>}
      {s.status === 'free' && s.mine && <Booked v={s.mine} color={color} up={up} ghost />}
      {s.status === 'reserved' && <Booked v={s.vehicle} color={color} up={up} />}
      {s.status === 'maintenance' && (<g>
        <path d="M6 10L48 76M48 10L6 76" stroke="#8b95a5" strokeOpacity=".25" strokeWidth="3" />
        <rect x="14" y="60" width="26" height="5" rx="1.5" fill="#f08a24" />
        <polygon points="27,22 36,60 18,60" fill="#f08a24" />
        <polygon points="24.6,36 29.4,36 30.6,44 23.4,44" fill="#fff" /><polygon points="22.4,50 31.6,50 32.6,56 21.4,56" fill="#fff" />
      </g>)}
      <text x="27" y={up ? 9 : 82} textAnchor="middle" fontSize="9" fontFamily="Sora, sans-serif" fill="#e8ebf0" opacity=".8">{s.id.split('-').pop()}</text>
    </svg>
  );
}

function Decor({ zone, lay }) {
  const { gw, gh, lanes } = lay, out = zone === 'Entrada', mid = gh / 2;
  const arrow = 'M0 -8L16 0L0 8L5 0Z';
  return (
    <>
      <defs>
        <pattern id="hz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="#2b3340" /><rect width="7" height="14" fill="#f5c542" opacity=".65" />
        </pattern>
      </defs>
      <rect width={gw} height={gh} fill={out ? '#16231d' : '#0f1318'} />
      <rect x="12" y="12" width={gw - 24} height={gh - 24} rx="14" fill={out ? '#262c35' : '#20262f'} stroke="#f5c542" strokeOpacity=".5" strokeWidth="3" strokeDasharray="14 10" />
      {out && [[16, 18], [gw - 16, 18], [16, gh - 18], [gw - 16, gh - 18], [gw / 2, 6], [gw / 2, gh - 6]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="15" fill="#1f4a33" /><circle cx={x - 2} cy={y - 2} r="8" fill="#2a6044" /></g>
      ))}
      {lanes.map((y, i) => (
        <g key={i}>
          <line x1={X0 - 14} x2={X0 + COLS * BW + 14} y1={y + LANE / 2} y2={y + LANE / 2} stroke="#fff" strokeOpacity=".28" strokeWidth="2" strokeDasharray="16 14" />
          {[2.5, 7.5].map(c => <path key={c} d={arrow} fill="#fff" fillOpacity=".3" transform={`translate(${X0 + c * BW} ${y + LANE / 2 - 14}) ${i % 2 ? 'scale(-1 1)' : ''}`} />)}
          {!out && [0, 5, 10].map(k => <rect key={k} x={X0 + k * BW - 7} y={y + LANE - 16} width="14" height="14" rx="2" fill="#3a4352" stroke="#566073" />)}
        </g>
      ))}
      <text x={X0 + (COLS * BW) / 2} y={lanes[0] + LANE / 2 + 11} textAnchor="middle" fontSize="30" fontWeight="700" fontFamily="Sora, sans-serif" letterSpacing="6" fill="#fff" opacity=".09">{ZONE_NAME[zone]}</text>
      {out ? (
        <g>
          <rect x="28" y={mid - 44} width="30" height="30" rx="4" fill="#3a4352" stroke="#566073" /><rect x="24" y={mid - 48} width="38" height="6" rx="2" fill="#566073" />
          <rect x="28" y={mid + 4} width="66" height="7" rx="2" fill="#f4f5f7" />
          {[40, 58, 76].map(x => <rect key={x} x={x} y={mid + 4} width="8" height="7" fill="#e5584f" />)}
          <text x="28" y={mid + 30} fontSize="11" fontWeight="600" fontFamily="Sora, sans-serif" fill="#e8ebf0" opacity=".8">ACCESO</text>
        </g>
      ) : (
        <g>
          <rect x="28" y={mid - 54} width="52" height="108" rx="6" fill="url(#hz)" opacity=".85" />
          <rect x="34" y={mid - 14} width="40" height="28" rx="4" fill="#13171d" /><text x="54" y={mid + 5} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily="Sora, sans-serif" fill="#f5c542">RAMPA</text>
          <rect x={gw - 54} y={mid - 28} width="34" height="56" rx="5" fill="#2b3340" stroke="#566073" strokeWidth="2" />
          <text x={gw - 37} y={mid + 4} textAnchor="middle" fontSize="10" fontWeight="600" fontFamily="Sora, sans-serif" fill="#e8ebf0">ASC.</text>
        </g>
      )}
    </>
  );
}

// Mapa interactivo: al seleccionar una casilla la vista se acerca a ella.
export default function ParkingMap({ zone, spaces, selected, onSelect }) {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const f = () => ref.current && setW(ref.current.clientWidth);
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const lay = layout(Math.max(...spaces.map(s => s.row)) + 1);
  const fit = Math.min(w / lay.gw, H / lay.gh, 1.3);
  let scale = fit, tx = (w - lay.gw * fit) / 2, ty = (H - lay.gh * fit) / 2;
  if (selected) {
    const p = lay.pos(selected);
    scale = Math.min(fit * 2.8, 3.4);
    tx = w / 2 - (p.x + BW / 2) * scale; ty = H / 2 - (p.y + BH / 2) * scale;
  }

  return (
    <div className="map" ref={ref} style={{ height: H }}>
      <div className="map-inner" style={{ width: lay.gw, height: lay.gh, transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
        <svg className="map-svg" width={lay.gw} height={lay.gh}><Decor zone={zone} lay={lay} /></svg>
        {spaces.map(s => {
          const p = lay.pos(s);
          return (
            <button key={s.id} className={`slot ${selected?.id === s.id ? 'sel' : ''}`} style={{ left: p.x, top: p.y, width: BW, height: BH }}
              title={`${s.id} · ${LABEL[s.status]}`} aria-label={`Espacio ${s.id}, ${LABEL[s.status]}`} onClick={() => onSelect(s)}>
              <SlotArt s={s} open={p.open} />
            </button>
          );
        })}
      </div>
      {selected && <button className="btn ghost map-reset" onClick={() => onSelect(null)}><ZoomOut size={16} /> Ver todo</button>}
    </div>
  );
}