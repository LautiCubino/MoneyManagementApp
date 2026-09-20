import { useState, useMemo, useRef, useEffect } from "react";

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  pagador: string;
  alias?: string;
  participantes?: string[];
}

interface Participante {
  nombre: string;
  alias?: string;
}

interface ItemDesglose {
    descripcion: string;
    monto: number;
}

interface TransferenciaAgrupada {
    de: string;
    para: string;
    alias?: string;
    montoTotal: number;
    items: ItemDesglose[];
}

function formatMonto(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function getAvatarColor(nombre: string) {
  const colors = [
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "bg-sky-500/20 text-sky-400 border-sky-500/30",
    "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "bg-rose-500/20 text-rose-400 border-rose-500/30",
    "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ];

  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function calcularTransferenciasAgrupadas(
    participantes: { nombre: string; alias?: string }[],
    gastos: Gasto[]
): TransferenciaAgrupada[] {
    // Mapa de clave "deudor->acreedor" para sumar montos
    const mapaDeudas: Record<string, TransferenciaAgrupada> = {};

    const aliasMap: Record<string, string | undefined> = {};
    participantes.forEach((p) => {
        aliasMap[p.nombre] = p.alias;
    });

    gastos.forEach((g) => {
        const consumidores =
            g.participantes && g.participantes.length > 0
                ? g.participantes
                : participantes.map((p) => p.nombre);

        if (consumidores.length === 0 || g.monto <= 0) return;

        const cuota = Math.round(g.monto / consumidores.length);

        consumidores.forEach((consumidor) => {
            if (consumidor !== g.pagador) {
                const clave = `${consumidor}->${g.pagador}`;

                if (!mapaDeudas[clave]) {
                    mapaDeudas[clave] = {
                        de: consumidor,
                        para: g.pagador,
                        alias: g.alias || aliasMap[g.pagador],
                        montoTotal: 0,
                        items: [],
                    };
                }

                mapaDeudas[clave].montoTotal += cuota;
                mapaDeudas[clave].items.push({
                    descripcion: g.descripcion,
                    monto: cuota,
                });
            }
        });
    });

    return Object.values(mapaDeudas);
}

export default function App() {
    const [gastos, setGastos] = useState<Gasto[]>(() => {
        try {
            const guardado = localStorage.getItem("money_app_gastos");
            return guardado ? JSON.parse(guardado) : [];
        } catch {
            return [];
        }
    });
    const [soloParticipantes, setSoloParticipantes] = useState<Participante[]>(() => {
        try {
            const guardado = localStorage.getItem("money_app_participantes");
            return guardado ? JSON.parse(guardado) : [];
        } catch {
            return [];
        }
    });
    // Guardamos automáticamente en localStorage cada vez que cambian
    useEffect(() => {
        localStorage.setItem("money_app_gastos", JSON.stringify(gastos));
    }, [gastos]);

    useEffect(() => {
        localStorage.setItem("money_app_participantes", JSON.stringify(soloParticipantes));
    }, [soloParticipantes]);

    const [showResumen, setShowResumen] = useState(false);

    const [tabActiva, setTabActiva] = useState<"participantes" | "detalle">("participantes");

    // Estados de edición
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editDesc, setEditDesc] = useState("");
    const [editMonto, setEditMonto] = useState("");

    // Estados de nuevo gasto
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
        () => calcularTransferenciasAgrupadas(participantes, gastos),
        [participantes, gastos]
    );

    const parteIgual = participantes.length > 0 ? totalGastado / participantes.length : 0;

    const sugerencias = useMemo(() => {
    const q = nombre.trim().toLowerCase();
    if (!q) return [];
    return participantes.filter(
        (p) => p.nombre.toLowerCase().startsWith(q) && p.nombre.toLowerCase() !== q
    );
  }, [nombre, participantes]);

    function toggleParticipanteEnGasto(gastoId: string, nombreP: string) {
    setGastos((prev) =>
        prev.map((g) => {
          if (g.id !== gastoId) return g;
          const actuales = g.participantes ?? participantes.map((p) => p.nombre);
          const yaEsta = actuales.includes(nombreP);

          // Impedir desmarcar al último (al menos 1 debe consumir)
          if (yaEsta && actuales.length === 1) return g;

          const nuevos = yaEsta
              ? actuales.filter((n) => n !== nombreP)
              : [...actuales, nombreP];

          return { ...g, participantes: nuevos };
        })
    );
  }

    function agregar() {
    const n = nombre.trim();
    const d = descripcion.trim();
    const al = alias.trim() || undefined;
    const m = parseFloat(monto.replace(",", "."));
    if (!n) return;

    if (!d && (isNaN(m) || m <= 0)) {
      setSoloParticipantes((prev) => {
        const yaExiste =
            prev.some((p) => p.nombre === n) || gastos.some((g) => g.pagador === n);
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
    setTabActiva("detalle");
    setNombre("");
    setAlias("");
    setDescripcion("");
    setMonto("");
    setTimeout(() => nombreRef.current?.focus(), 50);
  }

    const mensaje = useMemo(() => {
        let msg = `📋 Resumen de pagos por consumo\n\n`;

        if (gastos.length === 0) {
            msg += "No hay gastos cargados.\n";
            return msg;
        }

        const aliasMap: Record<string, string | undefined> = {};
        participantes.forEach((p) => {
            aliasMap[p.nombre] = p.alias;
        });

        gastos.forEach((g) => {
            const consumidores =
                g.participantes && g.participantes.length > 0
                    ? g.participantes
                    : participantes.map((p) => p.nombre);

            const deudores = consumidores.filter((c) => c !== g.pagador);
            const cuota = consumidores.length > 0 ? Math.round(g.monto / consumidores.length) : 0;
            const aliasFinal = g.alias || aliasMap[g.pagador];
            const aliasStr = aliasFinal ? ` [Alias: ${aliasFinal}]` : "";

            msg += `🔹 ${g.descripcion} (${formatMonto(g.monto)} - pagó ${g.pagador}${aliasStr})\n`;

            if (deudores.length === 0) {
                msg += `   (Lo consumió solo ${g.pagador})\n`;
            } else {
                deudores.forEach((d) => {
                    msg += `   • ${d} le transfiere ${formatMonto(cuota)} a ${g.pagador}\n`;
                });
            }
            msg += `\n`;
        });

        msg += `Total del grupo: ${formatMonto(totalGastado)}`;
        return msg;
    }, [gastos, participantes, totalGastado]);

    function iniciarEdicion(g: Gasto) {
    setEditandoId(g.id);
    setEditDesc(g.descripcion);
    setEditMonto(String(g.monto));
  }

    function guardarEdicion(id: string) {
    const parsedMonto = parseFloat(editMonto.replace(",", "."));
    if (!editDesc.trim() || isNaN(parsedMonto) || parsedMonto <= 0) return;

    setGastos((prev) =>
        prev.map((g) =>
            g.id === id ? { ...g, descripcion: editDesc.trim(), monto: parsedMonto } : g
        )
    );
    setEditandoId(null);
  }

    function enviarAWhatsApp() {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
    }

  return (
      <div className="fixed inset-0 bg-[#0a0c0f] flex flex-col font-sans text-[#e8eaed] overflow-hidden">
        {/* ── HEADER / TOTAL ─────────────────────────────────── */}
        <div className="shrink-0 px-5 pt-10 pb-6 text-center relative">
          <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-1">
            Total gastado
          </p>
          <p className="text-5xl font-display font-light text-[#e8eaed] tabular-nums">
            {formatMonto(totalGastado)}
          </p>

          {participantes.length > 0 && (
              <p className="text-xs text-[#6b7280] mt-2">
                {formatMonto(parteIgual)} prom. por persona · {participantes.length}{" "}
                participantes
              </p>
          )}

          {(gastos.length > 0 || soloParticipantes.length > 0) && (
              <button
                  onClick={() => {
                    if (confirm("¿Vaciar todo?")) {
                      setGastos([]);
                      setSoloParticipantes([]);
                      localStorage.removeItem("money_app_gastos");
                      localStorage.removeItem("money_app_participantes");
                    }
                  }}
                  className="absolute right-5 top-10 w-9 h-9 flex items-center justify-center rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e] active:scale-95 transition-all"
                  title="Vaciar todo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
          )}

          {participantes.length >= 2 && (
              <button
                  onClick={() => setShowResumen(true)}
                  className="absolute left-5 top-10 text-xs font-medium px-3 py-1.5 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] active:scale-95 transition-all"
              >
                Resumen
              </button>
          )}
        </div>

        {/* ── SELECTOR DE PESTAÑAS (TABS) ──────────────────────── */}
        <div className="shrink-0 px-4 border-b border-[#1f2329] flex justify-center gap-8 text-sm">
          <button
              type="button"
              onClick={() => setTabActiva("participantes")}
              className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
                  tabActiva === "participantes"
                      ? "text-[#22c55e]"
                      : "text-[#6b7280] hover:text-[#e8eaed]"
              }`}
          >
            <span>Participantes</span>
            {participantes.length > 0 && (
                <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        tabActiva === "participantes"
                            ? "bg-[#22c55e]/20 text-[#22c55e]"
                            : "bg-[#1a1d22] text-[#6b7280]"
                    }`}
                >
              {participantes.length}
            </span>
            )}
            {tabActiva === "participantes" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c55e] rounded-full" />
            )}
          </button>

          <button
              type="button"
              onClick={() => setTabActiva("detalle")}
              className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
                  tabActiva === "detalle"
                      ? "text-[#22c55e]"
                      : "text-[#6b7280] hover:text-[#e8eaed]"
              }`}
          >
            <span>Detalle</span>
            {gastos.length > 0 && (
                <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        tabActiva === "detalle"
                            ? "bg-[#22c55e]/20 text-[#22c55e]"
                            : "bg-[#1a1d22] text-[#6b7280]"
                    }`}
                >
              {gastos.length}
            </span>
            )}
            {tabActiva === "detalle" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c55e] rounded-full" />
            )}
          </button>
        </div>

        {/* ── CONTENIDO PRINCIPAL SEGÚN PESTAÑA ───────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-2">
          {/* PESTAÑA 1: PARTICIPANTES Y SALDOS */}
          {tabActiva === "participantes" && (
              <>
                {participantes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#6b7280] text-sm gap-2">
                      <span className="text-4xl">👥</span>
                      <span>No hay participantes agregados</span>
                    </div>
                ) : (
                    participantes.map((p) => {
                      const consumido = gastos.reduce((sum, g) => {
                        const consumen =
                            g.participantes && g.participantes.length > 0
                                ? g.participantes
                                : participantes.map((x) => x.nombre);
                        if (consumen.includes(p.nombre)) {
                          return sum + g.monto / consumen.length;
                        }
                        return sum;
                      }, 0);

                      const saldo = p.total - consumido;
                      const positivo = saldo > 0.5;
                      const negativo = saldo < -0.5;

                      return (
                          <div
                              key={p.nombre}
                              className="bg-[#111418] border border-[#1f2329] rounded-xl px-4 py-3 flex items-center gap-3"
                          >
                            <div
                                className={`w-9 h-9 rounded-full border text-sm flex items-center justify-center font-semibold shrink-0 uppercase ${getAvatarColor(
                                    p.nombre
                                )}`}
                            >
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
                                  <p className="text-xs text-[#22c55e]">
                                    le deben {formatMonto(saldo)}
                                  </p>
                              )}
                              {negativo && (
                                  <p className="text-xs text-[#f43f5e]">
                                    debe {formatMonto(-saldo)}
                                  </p>
                              )}
                              {!positivo && !negativo && gastos.length > 0 && (
                                  <p className="text-xs text-[#6b7280]">al día ✓</p>
                              )}
                            </div>
                          </div>
                      );
                    })
                )}
              </>
          )}

          {/* PESTAÑA 2: DETALLE DE GASTOS */}
          {tabActiva === "detalle" && (
              <>
                {gastos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#6b7280] text-sm gap-2">
                      <span className="text-4xl">🧾</span>
                      <span>No hay compras cargadas todavía</span>
                    </div>
                ) : (
                    gastos.map((g) => {
                      const estaEditando = editandoId === g.id;
                      const consumidores =
                          g.participantes ?? participantes.map((x) => x.nombre);

                      return (
                          <div
                              key={g.id}
                              className={`bg-[#0e1115] border rounded-xl p-3 space-y-2.5 transition-colors ${
                                  estaEditando ? "border-[#22c55e]/50 bg-[#111418]" : "border-[#1a1d22]"
                              }`}
                          >
                            {estaEditando ? (
                                <div className="flex items-center gap-2">
                                  <input
                                      autoFocus
                                      value={editDesc}
                                      onChange={(e) => setEditDesc(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && guardarEdicion(g.id)}
                                      placeholder="Descripción"
                                      className="flex-1 bg-[#1a1d22] border border-[#1f2329] rounded px-2.5 py-1.5 text-sm text-[#e8eaed] focus:outline-none focus:border-[#22c55e]"
                                  />
                                  <input
                                      value={editMonto}
                                      onChange={(e) => setEditMonto(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && guardarEdicion(g.id)}
                                      placeholder="Monto"
                                      inputMode="decimal"
                                      className="w-24 bg-[#1a1d22] border border-[#1f2329] rounded px-2.5 py-1.5 text-sm text-[#e8eaed] focus:outline-none focus:border-[#22c55e]"
                                  />
                                  <button
                                      onClick={() => guardarEdicion(g.id)}
                                      className="w-8 h-8 rounded bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 flex items-center justify-center font-bold text-sm"
                                  >
                                    ✓
                                  </button>
                                  <button
                                      onClick={() => setEditandoId(null)}
                                      className="w-8 h-8 rounded bg-[#1a1d22] text-[#6b7280] hover:text-[#e8eaed] flex items-center justify-center text-lg leading-none"
                                  >
                                    ×
                                  </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium tracking-wide uppercase truncate">
                                      {g.descripcion}
                                    </p>
                                    <p className="text-xs text-[#6b7280]">
                                      pagó <span className="text-[#9aa0ab]">{g.pagador}</span>
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold text-[#22c55e] shrink-0">
                          {formatMonto(g.monto)}
                        </span>
                                  <button
                                      onClick={() => iniciarEdicion(g)}
                                      className="text-[#6b7280] hover:text-[#22c55e] p-1 transition-colors shrink-0"
                                      title="Editar descripción y monto"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                                    </svg>
                                  </button>
                                  <button
                                      onClick={() =>
                                          setGastos((prev) => prev.filter((x) => x.id !== g.id))
                                      }
                                      className="text-[#6b7280] hover:text-[#f43f5e] p-1 transition-colors text-xl leading-none shrink-0"
                                  >
                                    ×
                                  </button>
                                </div>
                            )}

                            {/* Chips de consumidores de este gasto */}
                            {participantes.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#161a20]">
                        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider mr-1">
                          Consumen:
                        </span>
                                  {participantes.map((p) => {
                                    const activo = consumidores.includes(p.nombre);
                                    return (
                                        <button
                                            key={p.nombre}
                                            type="button"
                                            onClick={() =>
                                                toggleParticipanteEnGasto(g.id, p.nombre)
                                            }
                                            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                                                activo
                                                    ? "bg-[#22c55e]/15 border-[#22c55e]/30 text-[#22c55e] font-medium"
                                                    : "bg-transparent border-[#1f2329] text-[#6b7280] line-through opacity-40 hover:opacity-75"
                                            }`}
                                        >
                                          {p.nombre}
                                        </button>
                                    );
                                  })}
                                </div>
                            )}
                          </div>
                      );
                    })
                )}
              </>
          )}
        </div>

        {/* ── INPUT BAR ──────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#1f2329] bg-[#111418] px-4 pt-3.5 pb-6 space-y-3">
          {/* Grilla 2x2 simétrica: 4 campos con exactamente las mismas dimensiones */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Nombre con sugerencias */}
            <div className="relative">
              <input
                  ref={nombreRef}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    const match = participantes.find(
                        (p) =>
                            p.nombre.toLowerCase() === e.target.value.trim().toLowerCase()
                    );
                    if (match?.alias) setAlias(match.alias);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Tab" && sugerencias.length > 0) {
                      e.preventDefault();
                      const s = sugerencias[0];
                      setNombre(s.nombre);
                      if (s.alias) setAlias(s.alias);
                    } else if (e.key === "Enter") {
                      agregar();
                    }
                  }}
                  placeholder="¿Quién pagó?"
                  autoComplete="off"
                  className="w-full bg-[#1a1d22] border border-[#1f2329] rounded-xl px-3.5 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
              />
              {sugerencias.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-full bg-[#1a1d22] border border-[#22c55e]/40 rounded-xl overflow-hidden z-20 shadow-xl backdrop-blur-md">
                    {sugerencias.map((s) => (
                        <button
                            key={s.nombre}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNombre(s.nombre);
                              if (s.alias) setAlias(s.alias);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-[#22c55e]/10 flex items-center gap-2 border-b border-[#1f2329]/50 last:border-none"
                        >
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-xs flex items-center justify-center font-semibold uppercase shrink-0">
                      {s.nombre[0]}
                    </span>
                          <span className="truncate">{s.nombre}</span>
                          {s.alias && (
                              <span className="text-[#6b7280] text-xs truncate">@{s.alias}</span>
                          )}
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* 2. Alias */}
            <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregar()}
                placeholder="Alias (opcional)"
                className="w-full bg-[#1a1d22] border border-[#1f2329] rounded-xl px-3.5 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
            />

            {/* 3. Descripción */}
            <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregar()}
                placeholder="¿Qué compró?"
                className="w-full bg-[#1a1d22] border border-[#1f2329] rounded-xl px-3.5 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
            />

            {/* 4. Monto */}
            <input
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregar()}
                placeholder="Monto ($)"
                inputMode="decimal"
                className="w-full bg-[#1a1d22] border border-[#1f2329] rounded-xl px-3.5 py-2.5 text-sm text-[#e8eaed] placeholder:text-[#6b7280] focus:outline-none focus:border-[#22c55e] transition-colors"
            />
          </div>

          {/* Botón horizontal full width */}
          <button
              type="button"
              onClick={agregar}
              disabled={!nombre.trim()}
              className="w-full py-3 bg-[#22c55e] text-[#0a0c0f] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#16a34a] active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-[#22c55e]/10"
          >
            <span className="text-lg leading-none">+</span>
            <span>{descripcion.trim() || monto.trim() ? "Agregar gasto" : "Agregar participante"}</span>
          </button>
        </div>

          {/* ── MODAL RESUMEN ──────────────────────────────────── */}
          {showResumen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                  <div className="bg-[#111418] border border-[#1f2329] rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
                      {/* Header del modal */}
                      <div className="flex items-center justify-between shrink-0">
                          <h3 className="font-semibold text-base text-[#e8eaed]">Resumen de pagos</h3>
                          <button
                              type="button"
                              onClick={() => setShowResumen(false)}
                              className="w-8 h-8 rounded-full bg-[#1a1d22] text-[#6b7280] hover:text-[#e8eaed] flex items-center justify-center text-lg leading-none"
                          >
                              ×
                          </button>
                      </div>

                      {/* Lista de cartas por gasto */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                          {gastos.length === 0 ? (
                              <p className="text-[#6b7280] text-sm text-center py-6">
                                  ¡No hay gastos cargados todavía!
                              </p>
                          ) : (
                              gastos.map((g) => {
                                  const consumidores =
                                      g.participantes && g.participantes.length > 0
                                          ? g.participantes
                                          : participantes.map((p) => p.nombre);

                                  const deudores = consumidores.filter((c) => c !== g.pagador);
                                  const cuota =
                                      consumidores.length > 0 ? Math.round(g.monto / consumidores.length) : 0;
                                  const aliasPagador =
                                      g.alias || participantes.find((p) => p.nombre === g.pagador)?.alias;

                                  if (deudores.length === 0) return null;

                                  return (
                                      <div
                                          key={g.id}
                                          className="bg-[#0e1115] border border-[#1f2329] rounded-xl p-3.5 space-y-1.5"
                                      >
                                          <p className="text-sm font-semibold text-[#e8eaed]">
                                          <span className="text-[#22c55e] font-display font-medium text-base">
                                            {formatMonto(cuota)} c/u
                                          </span>{" "}
                                              a <span className="text-white">{g.pagador}</span> por{" "}
                                              <span className="text-[#9aa0ab] uppercase text-xs tracking-wide">
                                                {g.descripcion}
                                              </span>
                                          </p>

                                          <p className="text-xs text-[#6b7280]">
                                              <span className="text-[#9aa0ab]">Deben:</span> {deudores.join(", ")}
                                          </p>

                                          {aliasPagador && (
                                              <p className="text-xs text-[#22c55e]/90 font-mono pt-0.5">
                                                  Alias: <span className="text-[#e8eaed]">@{aliasPagador}</span>
                                              </p>
                                          )}
                                      </div>
                                  );
                              })
                          )}
                      </div>

                      {/* Botón único de WhatsApp al pie */}
                      <div className="shrink-0 pt-2 border-t border-[#1a1d22]">
                          <button
                              type="button"
                              onClick={enviarAWhatsApp}
                              className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-[#0e1115] text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20"
                          >
                              <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                              </svg>
                              <span>Compartir en WhatsApp</span>
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
}

