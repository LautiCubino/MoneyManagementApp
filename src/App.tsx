import { useState, useMemo, useRef } from "react";

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  pagador: string;
  alias?: string;
}

interface Participante {
  nombre: string;
  alias?: string;
}

function formatMonto(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function calcularTransferencias(
  participantes: { nombre: string; alias?: string; total: number }[],
  totalGastado: number
) {
  if (participantes.length < 2 || totalGastado === 0) return [];
  const parteIgual = totalGastado / participantes.length;

  const net = participantes.map((p) => ({
    nombre: p.nombre,
    alias: p.alias,
    saldo: p.total - parteIgual,
  }));

  const deudores = net
    .filter((p) => p.saldo < -0.01)
    .map((p) => ({ ...p, saldo: -p.saldo }))
    .sort((a, b) => b.saldo - a.saldo);

  const acreedores = net
    .filter((p) => p.saldo > 0.01)
    .sort((a, b) => b.saldo - a.saldo);

  const transferencias: { de: string; para: string; alias?: string; monto: number }[] = [];
  const d = deudores.map((x) => ({ ...x }));
  const a = acreedores.map((x) => ({ ...x }));

  let i = 0, j = 0;
  while (i < d.length && j < a.length) {
    const monto = Math.min(d[i].saldo, a[j].saldo);
    transferencias.push({ de: d[i].nombre, para: a[j].nombre, alias: a[j].alias, monto: Math.round(monto) });
    d[i].saldo -= monto;
    a[j].saldo -= monto;
    if (d[i].saldo < 0.01) i++;
    if (a[j].saldo < 0.01) j++;
  }
  return transferencias;
}

export default function App() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [soloParticipantes, setSoloParticipantes] = useState<Participante[]>([]);
  const [showResumen, setShowResumen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editMonto, setEditMonto] = useState("");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [alias, setAlias] = useState("");

  const nombreRef = useRef<HTMLInputElement>(null);

  const totalGastado = gastos.reduce((s, g) => s + g.monto, 0);

  const participantes = useMemo(() => {
    const map: Record<string, { nombre: string; alias?: string; total: number }> = {};
    soloParticipantes.forEach((p) => {
      map[p.nombre] = { nombre: p.nombre, alias: p.alias, total: 0 };
    });
    gastos.forEach((g) => {
      if (!map[g.pagador]) map[g.pagador] = { nombre: g.pagador, alias: g.alias, total: 0 };
      map[g.pagador].total += g.monto;
      if (g.alias) map[g.pagador].alias = g.alias;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [gastos, soloParticipantes]);

  const transferencias = useMemo(
    () => calcularTransferencias(participantes, totalGastado),
    [participantes, totalGastado]
  );

  const parteIgual = participantes.length > 0 ? totalGastado / participantes.length : 0;

  const sugerencias = useMemo(() => {
    const q = nombre.trim().toLowerCase();
    if (!q) return [];
    return participantes.filter(
      (p) => p.nombre.toLowerCase().startsWith(q) && p.nombre.toLowerCase() !== q
    );
  }, [nombre, participantes]);

  function agregar() {
    const n = nombre.trim();
    const d = descripcion.trim();
    const al = alias.trim() || undefined;
    const m = parseFloat(monto.replace(",", "."));
    if (!n) return;

    if (!d && (isNaN(m) || m <= 0)) {
      setSoloParticipantes((prev) => {
        const yaExiste = prev.some((p) => p.nombre === n) ||
          gastos.some((g) => g.pagador === n);
        if (yaExiste) return prev;
        return [...prev, { nombre: n, alias: al }];
      });
      setNombre("");
      setAlias("");
      setDescripcion("");
      setMonto("");
      setTimeout(() => nombreRef.current?.focus(), 50);
      return;
    }

    if (!d || isNaN(m) || m <= 0) return;

    setSoloParticipantes((prev) => prev.filter((p) => p.nombre !== n));
    setGastos((prev) => [
      { id: crypto.randomUUID(), descripcion: d, monto: m, pagador: n, alias: al },
      ...prev,
    ]);
    setNombre("");
    setAlias("");
    setDescripcion("");
    setMonto("");
    setTimeout(() => nombreRef.current?.focus(), 50);
  }

  const mensaje = useMemo(() => {
    let msg = `Resumen de pagos\n\n`;
    if (transferencias.length === 0) {
      msg += "¡Todos están al día! 🎉\n";
    } else {
      transferencias.forEach((t) => {
        const aliasStr = t.alias ? ` (Alias: ${t.alias})` : "";
        msg += `• ${t.de} le transfiere ${formatMonto(t.monto)} a ${t.para}${aliasStr}\n`;
      });
    }
    msg += `\nTotal gastado: ${formatMonto(totalGastado)}`;
    return msg;
  }, [transferencias, totalGastado]);

  function iniciarEdicion(g: Gasto) {
    setEditandoId(g.id);
    setEditDesc(g.descripcion);
    setEditMonto(String(g.monto));
  }

  function guardarEdicion(id: string) {
    const m = parseFloat(editMonto.replace(",", "."));
    if (!editDesc.trim() || isNaN(m) || m <= 0) return;
    setGastos((prev) =>
      prev.map((g) => g.id === id ? { ...g, descripcion: editDesc.trim(), monto: m } : g)
    );
    setEditandoId(null);
  }

  async function copiar() {
    await navigator.clipboard.writeText(mensaje);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-[#0a0c0f] flex flex-col font-sans text-[#e8eaed] overflow-hidden">

      {/* ── HEADER / TOTAL ─────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-10 pb-6 text-center relative">
        <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-1">Total gastado</p>
        <p className="text-5xl font-display font-light text-[#e8eaed] tabular-nums">
          {formatMonto(totalGastado)}
        </p>

        {participantes.length > 0 && (
          <p className="text-xs text-[#6b7280] mt-2">
            {formatMonto(parteIgual)} por persona · {participantes.length} participantes
          </p>
        )}

        {/* Papelera */}
        {(gastos.length > 0 || soloParticipantes.length > 0) && (
          <button
            onClick={() => {
              if (confirm("¿Vaciar todo?")) {
                setGastos([]);
                setSoloParticipantes([]);
              }
            }}
            className="absolute right-5 top-10 w-9 h-9 flex items-center justify-center rounded-full border border-[#1f2329] text-[#6b7280] hover:text-[#f43f5e] hover:border-[#f43f5e]/30 transition-colors"
            title="Vaciar todo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        )}

        {/* Botón resumen */}
        {participantes.length >= 2 && (
          <button
            onClick={() => setShowResumen(true)}
            className="absolute left-5 top-10 text-xs px-3 py-1.5 rounded-full border border-[#1f2329] text-[#6b7280] hover:text-[#22c55e] hover:border-[#22c55e]/40 transition-colors"
          >
            Resumen
          </button>
        )}
      </div>

      {/* ── LISTA PARTICIPANTES ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-2">
        {participantes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6b7280] text-sm gap-2">
            <span className="text-4xl">🧾</span>
            <span>Cargá el primer gasto abajo</span>
          </div>
        ) : (
          <>
            {/* participantes agrupados */}
            {participantes.map((p) => {
              const saldo = p.total - parteIgual;
              const positivo = saldo > 0.5;
              const negativo = saldo < -0.5;
              return (
                <div
                  key={p.nombre}
                  className="bg-[#111418] border border-[#1f2329] rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-sm flex items-center justify-center font-semibold shrink-0 uppercase">
                    {p.nombre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.nombre}</p>
                    {p.alias && (
                      <p className="text-xs text-[#6b7280] truncate">@{p.alias}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-display font-light text-[#22c55e]">
                      {formatMonto(p.total)}
                    </p>
                    {positivo && (
                      <p className="text-xs text-[#22c55e]">le deben {formatMonto(saldo)}</p>
                    )}
                    {negativo && (
                      <p className="text-xs text-[#f43f5e]">debe {formatMonto(-saldo)}</p>
                    )}
                    {!positivo && !negativo && gastos.length > 0 && (
                      <p className="text-xs text-[#6b7280]">al día ✓</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* gastos individuales */}
            {gastos.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-widest text-[#6b7280] pt-2 px-1">Detalle</p>
                {gastos.map((g) =>
                  editandoId === g.id ? (
                    <div key={g.id} className="flex items-center gap-2 px-3 py-2.5 bg-[#111418] border border-[#22c55e]/40 rounded-xl">
                      <input
                        autoFocus
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && guardarEdicion(g.id)}
                        className="flex-1 bg-[#1a1d22] border border-[#1f2329] rounded px-2 py-1.5 text-sm text-[#e8eaed] focus:outline-none focus:border-[#22c55e]"
                      />
                      <input
                        value={editMonto}
                        onChange={(e) => setEditMonto(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && guardarEdicion(g.id)}
                        type="number"
                        min="0"
                        className="w-20 bg-[#1a1d22] border border-[#1f2329] rounded px-2 py-1.5 text-sm text-[#e8eaed] focus:outline-none focus:border-[#22c55e]"
                      />
                      <button onClick={() => guardarEdicion(g.id)} className="text-[#22c55e] text-sm font-semibold px-1">✓</button>
                      <button onClick={() => setEditandoId(null)} className="text-[#6b7280] text-lg leading-none">×</button>
                    </div>
                  ) : (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#0e1115] border border-[#1a1d22] rounded-xl group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{g.descripcion}</p>
                        <p className="text-xs text-[#6b7280]">pagó {g.pagador}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#22c55e] shrink-0">{formatMonto(g.monto)}</span>
                      <button
                        onClick={() => iniciarEdicion(g)}
                        className="text-[#6b7280] hover:text-[#22c55e] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setGastos((prev) => prev.filter((x) => x.id !== g.id))}
                        className="text-[#6b7280] hover:text-[#f43f5e] opacity-0 group-hover:opacity-100 transition-all text-xl leading-none shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── INPUT BAR ──────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[#1f2329] bg-[#111418] px-4 pt-4 pb-6 space-y-2.5">
        <div className="grid grid-cols-2 gap-2 relative">
          <div className="relative">
            <input
              ref={nombreRef}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                // pre-fill alias si el participante ya existe
                const match = participantes.find(
                  (p) => p.nombre.toLowerCase() === e.target.value.trim().toLowerCase()
                );
                if (match?.alias) setAlias(match.alias);
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && sugerencias.length > 0) {
                  e.preventDefault();
                  const s = sugerencias[0];
                  setNombre(s.nombre);
                  if (s.alias) setAlias(s.alias);
                }
              }}
              placeholder="Nombre"
              autoComplete="off"
              className="w-full bg-[#1a1d22] border border-[#1f2329] rounded-lg px-3 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
            />
            {sugerencias.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1a1d22] border border-[#22c55e]/40 rounded-lg overflow-hidden z-10 shadow-lg">
                {sugerencias.map((s) => (
                  <button
                    key={s.nombre}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setNombre(s.nombre);
                      if (s.alias) setAlias(s.alias);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#22c55e]/10 flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-xs flex items-center justify-center font-semibold uppercase shrink-0">
                      {s.nombre[0]}
                    </span>
                    <span>{s.nombre}</span>
                    {s.alias && <span className="text-[#6b7280] text-xs">@{s.alias}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Alias (opcional)"
            className="bg-[#1a1d22] border border-[#1f2329] rounded-lg px-3 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
            placeholder="¿Qué se compró?"
            className="flex-1 bg-[#1a1d22] border border-[#1f2329] rounded-lg px-3 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
          />
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
            placeholder="$"
            type="number"
            min="0"
            className="w-24 bg-[#1a1d22] border border-[#1f2329] rounded-lg px-3 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
          />
          <button
            onClick={agregar}
            disabled={!nombre}
            className="w-11 h-11 bg-[#22c55e] text-[#0a0c0f] rounded-lg text-xl font-bold flex items-center justify-center hover:bg-[#16a34a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* ── MODAL RESUMEN ──────────────────────────────────── */}
      {showResumen && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowResumen(false)}>
          <div
            className="bg-[#111418] border-t border-[#1f2329] w-full rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-light text-lg">Resumen de pagos</h2>
              <button
                onClick={() => setShowResumen(false)}
                className="text-[#6b7280] hover:text-[#e8eaed] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {transferencias.length === 0 ? (
              <p className="text-[#6b7280] text-sm text-center py-4">¡Todos están al día! 🎉</p>
            ) : (
              <div className="space-y-2">
                {transferencias.map((t, i) => (
                  <div key={i} className="bg-[#1a1d22] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{t.de}</span>
                        <span className="text-[#6b7280] mx-2">→</span>
                        <span className="font-semibold">{t.para}</span>
                      </p>
                      {t.alias && <p className="text-xs text-[#6b7280]">Alias: {t.alias}</p>}
                    </div>
                    <span className="text-base font-display font-light text-[#f43f5e] shrink-0">
                      {formatMonto(t.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <pre className="text-sm text-[#9aa0ab] whitespace-pre-wrap font-sans leading-relaxed bg-[#0a0c0f] rounded-xl p-4 border border-[#1f2329]">
              {mensaje}
            </pre>

            <button
              onClick={copiar}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                copiado
                  ? "bg-[#22c55e]/20 text-[#22c55e]"
                  : "bg-[#22c55e] text-[#0a0c0f] hover:bg-[#16a34a]"
              }`}
            >
              {copiado ? "✓ Copiado" : "Copiar mensaje"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
