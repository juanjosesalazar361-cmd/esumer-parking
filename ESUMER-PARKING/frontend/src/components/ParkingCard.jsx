export default function ParkingCard({ zone, free, reserved, occupied, maintenance, total }) {
  const pct = n => `${(n / total) * 100}%`;
  return (
    <div className="card">
      <div className="row between"><h3>{zone}</h3><span className="big">{free}<small> libres</small></span></div>
      <div className="bar">
        <i className="s-occupied" style={{ width: pct(occupied) }} /><i className="s-reserved" style={{ width: pct(reserved) }} />
        <i className="s-maintenance" style={{ width: pct(maintenance) }} /><i className="s-free" style={{ width: pct(free) }} />
      </div>
      <p className="muted">{occupied} ocupados · {reserved} reservados · {total} espacios en total</p>
    </div>
  );
}
