import { useEffect, useState } from 'react';
import { api, fmt } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function History() {
  const { user } = useAuth(); const [list, setList] = useState([]);
  useEffect(() => { api.history().then(setList); }, []);
  return (
    <>
      <div className="page-head"><h1>Historial</h1></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Fecha</th>{user.role === 'admin' && <th>Usuario</th>}<th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>{list.map(h => <tr key={h.id}><td>{fmt(h.at)}</td>{user.role === 'admin' && <td>{h.userName}</td>}<td>{h.action}</td><td>{h.detail}</td></tr>)}</tbody>
      </table>{list.length === 0 && <p className="muted pad">Sin movimientos todavía.</p>}</div>
    </>
  );
}
