import { useState, useEffect, useMemo } from "react";

// ── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_CLIENTS = [
  { id: 1, nombre: "Carlos Mendoza", telefono: "573001234567", vehiculo: "Toyota Corolla", placa: "ABC-123", fechaVencimiento: daysFromNow(5), plan: "Básico", estado: "activo" },
  { id: 2, nombre: "María García", telefono: "573009876543", vehiculo: "Chevrolet Spark", placa: "XYZ-456", fechaVencimiento: daysFromNow(2), plan: "Premium", estado: "activo" },
  { id: 3, nombre: "Andrés Torres", telefono: "573005551234", vehiculo: "Renault Logan", placa: "DEF-789", fechaVencimiento: daysFromNow(-3), plan: "Básico", estado: "vencido" },
  { id: 4, nombre: "Lucía Herrera", telefono: "573007778888", vehiculo: "Hyundai i10", placa: "GHI-012", fechaVencimiento: daysFromNow(15), plan: "Premium", estado: "activo" },
  { id: 5, nombre: "Pedro Ramírez", telefono: "573003334444", vehiculo: "Kia Picanto", placa: "JKL-345", fechaVencimiento: daysFromNow(30), plan: "Básico", estado: "activo" },
  { id: 6, nombre: "Sofía Jiménez", telefono: "573002223333", vehiculo: "Mazda 3", placa: "MNO-678", fechaVencimiento: daysFromNow(7), plan: "Premium", estado: "activo" },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function diasRestantes(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha);
  return Math.round((venc - hoy) / 86400000);
}

function estadoBadge(dias) {
  if (dias < 0) return { label: "Vencido", color: "#FF4D4D", bg: "#2a1010" };
  if (dias <= 5) return { label: `${dias}d`, color: "#FF9500", bg: "#2a1e00" };
  if (dias <= 15) return { label: `${dias}d`, color: "#FFD60A", bg: "#1e1a00" };
  return { label: `${dias}d`, color: "#30D158", bg: "#0a1e0f" };
}

const EMPTY_FORM = { nombre: "", telefono: "", vehiculo: "", placa: "", fechaVencimiento: "", plan: "Básico" };

// ── WhatsApp message generator ───────────────────────────────────────────────
function generarMensaje(cliente) {
  const dias = diasRestantes(cliente.fechaVencimiento);
  if (dias < 0) {
    return `Hola ${cliente.nombre} 👋\n\nTu servicio GPS para *${cliente.vehiculo}* (${cliente.placa}) lleva *${Math.abs(dias)} días vencido*.\n\nRenueva ahora para seguir monitoreando tu vehículo 🚗📡\n\n¿Quieres que te enviemos el link de pago?`;
  }
  return `Hola ${cliente.nombre} 👋\n\nTe recordamos que tu servicio GPS para *${cliente.vehiculo}* (${cliente.placa}) vence en *${dias} día${dias !== 1 ? "s" : ""}*.\n\nRenueva antes para no perder el seguimiento de tu vehículo 🚗📡\n\n¿Quieres que te enviemos el link de pago?`;
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [clientes, setClientes] = useState(SAMPLE_CLIENTS);
  const [vista, setVista] = useState("dashboard"); // dashboard | lista | agregar | detalle | make
  const [clienteActivo, setClienteActivo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [mensajeCopiado, setMensajeCopiado] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const vencidos = clientes.filter(c => diasRestantes(c.fechaVencimiento) < 0).length;
    const urgentes = clientes.filter(c => { const d = diasRestantes(c.fechaVencimiento); return d >= 0 && d <= 5; }).length;
    const proximos = clientes.filter(c => { const d = diasRestantes(c.fechaVencimiento); return d > 5 && d <= 15; }).length;
    const activos = clientes.filter(c => diasRestantes(c.fechaVencimiento) >= 0).length;
    return { total: clientes.length, vencidos, urgentes, proximos, activos };
  }, [clientes]);

  // Filtrado
  const clientesFiltrados = useMemo(() => {
    let result = clientes;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        c.placa.toLowerCase().includes(q) ||
        c.vehiculo.toLowerCase().includes(q)
      );
    }
    if (filtro === "vencidos") result = result.filter(c => diasRestantes(c.fechaVencimiento) < 0);
    if (filtro === "urgentes") result = result.filter(c => { const d = diasRestantes(c.fechaVencimiento); return d >= 0 && d <= 5; });
    if (filtro === "proximos") result = result.filter(c => { const d = diasRestantes(c.fechaVencimiento); return d > 5 && d <= 15; });
    if (filtro === "activos") result = result.filter(c => diasRestantes(c.fechaVencimiento) > 15);
    return result.sort((a, b) => diasRestantes(a.fechaVencimiento) - diasRestantes(b.fechaVencimiento));
  }, [clientes, busqueda, filtro]);

  const guardarCliente = () => {
    if (!form.nombre || !form.telefono || !form.fechaVencimiento) {
      showToast("Completa nombre, teléfono y fecha", "error");
      return;
    }
    if (editando) {
      setClientes(prev => prev.map(c => c.id === clienteActivo.id ? { ...c, ...form } : c));
      showToast("Cliente actualizado ✓");
    } else {
      const nuevo = { ...form, id: Date.now(), estado: "activo" };
      setClientes(prev => [...prev, nuevo]);
      showToast("Cliente agregado ✓");
    }
    setForm(EMPTY_FORM);
    setEditando(false);
    setVista("lista");
  };

  const eliminarCliente = (id) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    setVista("lista");
    showToast("Cliente eliminado");
  };

  const abrirEditar = (cliente) => {
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono, vehiculo: cliente.vehiculo, placa: cliente.placa, fechaVencimiento: cliente.fechaVencimiento, plan: cliente.plan });
    setClienteActivo(cliente);
    setEditando(true);
    setVista("agregar");
  };

  const copiarMensaje = (cliente) => {
    navigator.clipboard.writeText(generarMensaje(cliente));
    setMensajeCopiado(true);
    setTimeout(() => setMensajeCopiado(false), 2000);
    showToast("Mensaje copiado ✓");
  };

  const abrirWhatsApp = (cliente) => {
    const msg = encodeURIComponent(generarMensaje(cliente));
    const tel = cliente.telefono.replace(/\D/g, "");
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  };

  // Exportar CSV para Make.com
  const exportarCSV = () => {
    const header = "nombre,telefono,vehiculo,placa,fechaVencimiento,plan,diasRestantes\n";
    const rows = clientes.map(c =>
      `"${c.nombre}","${c.telefono}","${c.vehiculo}","${c.placa}","${c.fechaVencimiento}","${c.plan}","${diasRestantes(c.fechaVencimiento)}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clientes-gps.csv"; a.click();
    showToast("CSV exportado ✓");
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    app: { minHeight: "100vh", background: "#0a0e1a", color: "#e8eaf0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 },
    nav: { background: "#0d1220", borderBottom: "1px solid #1e2a3a", padding: "0 20px", display: "flex", alignItems: "center", gap: 8, height: 56, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontWeight: 700, fontSize: 16, color: "#4FC3F7", letterSpacing: "-0.3px", marginRight: "auto" },
    navBtn: (active) => ({ background: active ? "#1a2744" : "transparent", color: active ? "#4FC3F7" : "#8899aa", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all .15s" }),
    main: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
    card: { background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: 12, padding: 20 },
    statCard: (color) => ({ background: "#0d1220", border: `1px solid ${color}33`, borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 120 }),
    statNum: (color) => ({ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }),
    statLabel: { fontSize: 12, color: "#667788", marginTop: 4 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginTop: 16 },
    clientCard: { background: "#0d1220", border: "1px solid #1e2a3a", borderRadius: 12, padding: 18, cursor: "pointer", transition: "border-color .2s, transform .15s" },
    input: { width: "100%", background: "#111827", border: "1px solid #1e2a3a", borderRadius: 8, padding: "10px 14px", color: "#e8eaf0", fontSize: 14, boxSizing: "border-box", outline: "none" },
    label: { display: "block", fontSize: 12, color: "#667788", marginBottom: 6, fontWeight: 500 },
    btn: (v) => ({
      background: v === "primary" ? "#1565C0" : v === "green" ? "#1B5E20" : v === "danger" ? "#B71C1C" : v === "ghost" ? "transparent" : "#1a2030",
      color: v === "primary" ? "#90CAF9" : v === "green" ? "#A5D6A7" : v === "danger" ? "#EF9A9A" : v === "ghost" ? "#667788" : "#aab",
      border: v === "ghost" ? "1px solid #1e2a3a" : "none",
      borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "opacity .15s"
    }),
    badge: (dias) => { const b = estadoBadge(dias); return { background: b.bg, color: b.color, borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700 }; },
    row: { display: "flex", alignItems: "center", gap: 10 },
    divider: { borderTop: "1px solid #1e2a3a", margin: "16px 0" },
    searchInput: { background: "#111827", border: "1px solid #1e2a3a", borderRadius: 8, padding: "9px 14px", color: "#e8eaf0", fontSize: 14, outline: "none", width: "100%", maxWidth: 280 },
    filterBtn: (active) => ({ background: active ? "#1a2744" : "#111827", color: active ? "#4FC3F7" : "#667788", border: `1px solid ${active ? "#1e3a5f" : "#1e2a3a"}`, borderRadius: 7, padding: "6px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600 }),
    makeStep: { background: "#0a0e1a", border: "1px solid #1e2a3a", borderRadius: 10, padding: "14px 18px", marginBottom: 10 },
    codeBlock: { background: "#060a12", border: "1px solid #1e2a3a", borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 12, color: "#A5D6A7", overflowX: "auto", whiteSpace: "pre-wrap" },
  };

  // ── Views ──────────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Panel de Control</h2>
        <p style={{ color: "#667788", margin: 0 }}>Gestión de clientes GPS · {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={s.statCard("#4FC3F7")}><div style={s.statNum("#4FC3F7")}>{stats.total}</div><div style={s.statLabel}>Total clientes</div></div>
        <div style={s.statCard("#FF4D4D")}><div style={s.statNum("#FF4D4D")}>{stats.vencidos}</div><div style={s.statLabel}>Vencidos</div></div>
        <div style={s.statCard("#FF9500")}><div style={s.statNum("#FF9500")}>{stats.urgentes}</div><div style={s.statLabel}>Vencen en 5 días</div></div>
        <div style={s.statCard("#FFD60A")}><div style={s.statNum("#FFD60A")}>{stats.proximos}</div><div style={s.statLabel}>Próximos 15 días</div></div>
        <div style={s.statCard("#30D158")}><div style={s.statNum("#30D158")}>{stats.activos}</div><div style={s.statLabel}>Al día</div></div>
      </div>

      {/* Urgentes */}
      <div style={s.card}>
        <div style={{ ...s.row, marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>🚨 Requieren atención ahora</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#667788" }}>{stats.vencidos + stats.urgentes} clientes</span>
        </div>
        {clientes.filter(c => diasRestantes(c.fechaVencimiento) <= 5).sort((a,b) => diasRestantes(a.fechaVencimiento) - diasRestantes(b.fechaVencimiento)).slice(0, 6).map(c => {
          const dias = diasRestantes(c.fechaVencimiento);
          return (
            <div key={c.id} style={{ ...s.row, padding: "10px 0", borderBottom: "1px solid #1a2030" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                <div style={{ color: "#667788", fontSize: 12 }}>{c.vehiculo} · {c.placa}</div>
              </div>
              <span style={s.badge(dias)}>{dias < 0 ? `Hace ${Math.abs(dias)}d` : dias === 0 ? "Hoy" : `${dias}d`}</span>
              <button style={{ ...s.btn("green"), padding: "6px 12px", fontSize: 12 }} onClick={() => abrirWhatsApp(c)}>📱 WA</button>
            </div>
          );
        })}
        {stats.vencidos + stats.urgentes === 0 && <p style={{ color: "#30D158", textAlign: "center", padding: 16 }}>✓ Sin alertas pendientes</p>}
      </div>
    </div>
  );

  const renderLista = () => (
    <div>
      <div style={{ ...s.row, marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <input style={s.searchInput} placeholder="Buscar por nombre, placa, teléfono…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <div style={{ ...s.row, gap: 6, flexWrap: "wrap" }}>
          {["todos","vencidos","urgentes","proximos","activos"].map(f => (
            <button key={f} style={s.filterBtn(filtro === f)} onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f === "vencidos" ? "Vencidos" : f === "urgentes" ? "≤5 días" : f === "proximos" ? "≤15 días" : "Al día"}
            </button>
          ))}
        </div>
        <button style={{ ...s.btn("ghost"), marginLeft: "auto" }} onClick={exportarCSV}>⬇ CSV</button>
        <button style={s.btn("primary")} onClick={() => { setEditando(false); setForm(EMPTY_FORM); setVista("agregar"); }}>+ Agregar</button>
      </div>

      <div style={{ color: "#667788", fontSize: 12, marginBottom: 12 }}>{clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? "s" : ""}</div>

      <div style={s.grid}>
        {clientesFiltrados.map(c => {
          const dias = diasRestantes(c.fechaVencimiento);
          const b = estadoBadge(dias);
          return (
            <div key={c.id} style={{ ...s.clientCard, borderColor: dias < 0 ? "#3a1010" : dias <= 5 ? "#3a2800" : "#1e2a3a" }}
              onClick={() => { setClienteActivo(c); setVista("detalle"); }}>
              <div style={{ ...s.row, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.nombre}</div>
                  <div style={{ color: "#667788", fontSize: 12 }}>{c.vehiculo} · {c.placa}</div>
                </div>
                <span style={s.badge(dias)}>{dias < 0 ? `−${Math.abs(dias)}d` : dias === 0 ? "Hoy" : `+${dias}d`}</span>
              </div>
              <div style={{ ...s.row, fontSize: 12, color: "#556677", justifyContent: "space-between" }}>
                <span>📱 {c.telefono}</span>
                <span style={{ color: c.plan === "Premium" ? "#FFD60A" : "#667788" }}>{c.plan}</span>
              </div>
              <div style={{ ...s.divider, margin: "12px 0" }} />
              <div style={{ ...s.row, gap: 8 }} onClick={e => e.stopPropagation()}>
                <button style={{ ...s.btn("green"), padding: "6px 0", flex: 1, fontSize: 12 }} onClick={() => abrirWhatsApp(c)}>📱 WhatsApp</button>
                <button style={{ ...s.btn("ghost"), padding: "6px 0", flex: 1, fontSize: 12 }} onClick={() => copiarMensaje(c)}>📋 Copiar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDetalle = () => {
    if (!clienteActivo) return null;
    const c = clientes.find(x => x.id === clienteActivo.id) || clienteActivo;
    const dias = diasRestantes(c.fechaVencimiento);
    const msg = generarMensaje(c);
    return (
      <div>
        <button style={{ ...s.btn("ghost"), marginBottom: 20 }} onClick={() => setVista("lista")}>← Volver</button>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...s.card, flex: 1, minWidth: 260 }}>
            <div style={{ ...s.row, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>{c.nombre}</h2>
                <span style={{ color: "#667788", fontSize: 13 }}>{c.plan}</span>
              </div>
              <span style={{ ...s.badge(dias), marginLeft: "auto", fontSize: 14 }}>{dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : dias === 0 ? "Vence hoy" : `${dias} días restantes`}</span>
            </div>
            <div style={s.divider} />
            {[["📱 Teléfono", c.telefono], ["🚗 Vehículo", c.vehiculo], ["🔖 Placa", c.placa], ["📅 Vencimiento", c.fechaVencimiento]].map(([k, v]) => (
              <div key={k} style={{ ...s.row, justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                <span style={{ color: "#667788", fontSize: 13 }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ ...s.row, gap: 10, marginTop: 20 }}>
              <button style={{ ...s.btn("primary"), flex: 1 }} onClick={() => abrirWhatsApp(c)}>📱 Enviar WhatsApp</button>
              <button style={s.btn("ghost")} onClick={() => abrirEditar(c)}>✏️ Editar</button>
              <button style={s.btn("danger")} onClick={() => eliminarCliente(c.id)}>🗑️</button>
            </div>
          </div>
          <div style={{ ...s.card, flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Vista previa del mensaje</div>
            <div style={{ background: "#111827", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#ccd", whiteSpace: "pre-wrap", borderLeft: "3px solid #25D366" }}>{msg}</div>
            <button style={{ ...s.btn("green"), marginTop: 14, width: "100%" }} onClick={() => copiarMensaje(c)}>📋 Copiar mensaje</button>
          </div>
        </div>
      </div>
    );
  };

  const renderAgregar = () => (
    <div>
      <button style={{ ...s.btn("ghost"), marginBottom: 20 }} onClick={() => { setVista("lista"); setEditando(false); setForm(EMPTY_FORM); }}>← Volver</button>
      <div style={{ ...s.card, maxWidth: 520 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17 }}>{editando ? "Editar cliente" : "Nuevo cliente"}</h3>
        {[
          { key: "nombre", label: "Nombre completo", type: "text", ph: "Ej: Carlos Mendoza" },
          { key: "telefono", label: "Teléfono WhatsApp (con código de país)", type: "text", ph: "Ej: 573001234567" },
          { key: "vehiculo", label: "Vehículo", type: "text", ph: "Ej: Toyota Corolla" },
          { key: "placa", label: "Placa", type: "text", ph: "Ej: ABC-123" },
          { key: "fechaVencimiento", label: "Fecha de vencimiento", type: "date", ph: "" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={s.label}>{f.label}</label>
            <input style={s.input} type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Plan</label>
          <select style={s.input} value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}>
            <option>Básico</option>
            <option>Premium</option>
          </select>
        </div>
        <button style={{ ...s.btn("primary"), width: "100%", padding: "11px" }} onClick={guardarCliente}>
          {editando ? "Guardar cambios" : "Agregar cliente"}
        </button>
      </div>
    </div>
  );

  const renderMake = () => (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>⚙️ Automatización con Make.com</h2>
      <p style={{ color: "#667788", marginBottom: 24 }}>Configura el envío automático de WhatsApp para los 2,000 clientes sin hacer nada manualmente.</p>

      {[
        {
          n: "1", title: "Exporta tu base de datos",
          desc: "Haz clic en '⬇ CSV' en la sección de lista. Ese archivo lo subes a Google Sheets.",
          code: null
        },
        {
          n: "2", title: "Sube el CSV a Google Sheets",
          desc: "En Google Sheets → Archivo → Importar → sube el CSV. Eso se convierte en tu base de datos en la nube que Make.com leerá.",
          code: null
        },
        {
          n: "3", title: "Crea una cuenta en Make.com",
          desc: "En make.com créate una cuenta gratuita (incluye 1,000 operaciones/mes). Para 2,000 clientes necesitarás el plan Core (~$9/mes).",
          code: null
        },
        {
          n: "4", title: "Conecta WhatsApp Business",
          desc: "En Make.com → Apps → busca 'WhatsApp Business'. Conecta tu número de WhatsApp Business API. También puedes usar Twilio si no tienes la API oficial.",
          code: null
        },
        {
          n: "5", title: "Crea el Escenario (automatización)",
          desc: "Crea un nuevo Scenario con estos módulos en orden:",
          code: `Módulo 1: Schedule → "Every day at 9:00 AM"
Módulo 2: Google Sheets → "Search Rows"
  → Filtro: fechaVencimiento <= HOY + 5 días
  → Y: fechaVencimiento >= HOY - 1 día
Módulo 3: WhatsApp → "Send a Text Message"
  → To: {{telefono}}
  → Message: "Hola {{nombre}}, tu GPS vence en {{diasRestantes}} días..."`
        },
        {
          n: "6", title: "Fórmula para calcular días en Google Sheets",
          desc: "Agrega esta columna en tu Google Sheets para calcular los días automáticamente:",
          code: `=DAYS(B2, TODAY())
// Donde B2 = columna fechaVencimiento
// Resultado: número de días restantes (negativo = vencido)`
        },
        {
          n: "7", title: "Configura los 3 recordatorios",
          desc: "Crea 3 escenarios separados en Make.com para máxima efectividad:",
          code: `Escenario A: diasRestantes = 7  → "Vence en una semana"
Escenario B: diasRestantes = 3  → "Vence en 3 días ⚠️"
Escenario C: diasRestantes < 0  → "Tu GPS está vencido 🚨"`
        },
      ].map(step => (
        <div key={step.n} style={s.makeStep}>
          <div style={{ ...s.row, marginBottom: 8 }}>
            <div style={{ background: "#1a2744", color: "#4FC3F7", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{step.n}</div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{step.title}</span>
          </div>
          <p style={{ color: "#8899aa", fontSize: 13, margin: "0 0 10px", lineHeight: 1.6 }}>{step.desc}</p>
          {step.code && <div style={s.codeBlock}>{step.code}</div>}
        </div>
      ))}

      <div style={{ ...s.card, marginTop: 20, borderColor: "#1B5E20" }}>
        <div style={{ fontWeight: 600, color: "#A5D6A7", marginBottom: 8 }}>💡 Alternativa gratis: CallMeBot</div>
        <p style={{ color: "#667788", fontSize: 13, margin: "0 0 10px" }}>Si no quieres pagar Make.com, puedes usar CallMeBot (gratuito, hasta ~1,500 msg/día). Solo funciona si tus clientes aceptan el bot primero. Ideal para empezar.</p>
        <div style={s.codeBlock}>{`// URL de CallMeBot (en Make.com, módulo HTTP Request):
https://api.callmebot.com/whatsapp.php?phone={{telefono}}&text={{mensaje}}&apikey=TU_API_KEY

// El cliente debe activarlo enviando este mensaje a +34 644 44 88 24:
// "I allow callmebot to send me messages"`}</div>
      </div>

      <button style={{ ...s.btn("ghost"), marginTop: 16 }} onClick={exportarCSV}>⬇ Exportar CSV para subir a Google Sheets</button>
    </div>
  );

  return (
    <div style={s.app}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.tipo === "error" ? "#B71C1C" : "#1B5E20", color: toast.tipo === "error" ? "#EF9A9A" : "#A5D6A7", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px #0006" }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={s.nav}>
        <span style={s.logo}>📡 GPS Manager</span>
        <button style={s.navBtn(vista === "dashboard")} onClick={() => setVista("dashboard")}>Dashboard</button>
        <button style={s.navBtn(vista === "lista" || vista === "detalle")} onClick={() => setVista("lista")}>Clientes</button>
        <button style={s.navBtn(vista === "make")} onClick={() => setVista("make")}>🤖 Automatizar</button>
      </nav>

      {/* Main */}
      <main style={s.main}>
        {vista === "dashboard" && renderDashboard()}
        {vista === "lista" && renderLista()}
        {vista === "detalle" && renderDetalle()}
        {vista === "agregar" && renderAgregar()}
        {vista === "make" && renderMake()}
      </main>
    </div>
  );
}
