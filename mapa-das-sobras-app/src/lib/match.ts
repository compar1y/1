import type { RugModel, Thickness } from '../data/models';

export interface Yarn {
  id: string;
  colorName: string;
  hex: string;
  grams: number;
  thickness: Thickness;
}

export interface SlotResult {
  role: string;
  need: number;
  refName: string;
  refHex: string;
  yarn: Yarn | null;
  ok: boolean;
}

export type FitStatus = 'cabe' | 'quase' | 'nao';

export interface FitResult {
  model: RugModel;
  slots: SlotResult[];
  status: FitStatus;
  totalNeed: number;
  totalHave: number;
  missing: number;
  margin: number;
}

/** Tolerância para considerar "quase cabe" (dá para resolver trocando uma cor). */
export const ALMOST_GRAMS = 40;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Distribui as sobras da mesma espessura entre as cores do modelo.
 * Maiores necessidades primeiro; prefere a sobra da mesma cor da referência,
 * senão a maior sobra ainda livre.
 */
export function fitModel(model: RugModel, stash: Yarn[]): FitResult {
  const pool = stash.filter((y) => y.thickness === model.thickness && y.grams > 0);
  const used = new Set<string>();
  const order = [...model.slots].map((s, i) => ({ s, i })).sort((a, b) => b.s.grams - a.s.grams);
  const results: SlotResult[] = new Array(model.slots.length);

  for (const { s, i } of order) {
    const free = pool.filter((y) => !used.has(y.id)).sort((a, b) => b.grams - a.grams);
    const sameColor = free.find((y) => norm(y.colorName) === norm(s.refName) && y.grams >= s.grams);
    const enough = free.filter((y) => y.grams >= s.grams);
    // Entre as que bastam, usa a menor (economiza as grandes para outras cores).
    const pick = sameColor ?? (enough.length ? enough[enough.length - 1] : free[0]) ?? null;
    if (pick) used.add(pick.id);
    results[i] = {
      role: s.role,
      need: s.grams,
      refName: s.refName,
      refHex: s.refHex,
      yarn: pick,
      ok: !!pick && pick.grams >= s.grams,
    };
  }

  const totalNeed = model.slots.reduce((a, s) => a + s.grams, 0);
  const totalHave = results.reduce((a, r) => a + (r.yarn?.grams ?? 0), 0);
  const missing = results.reduce((a, r) => a + Math.max(0, r.need - (r.yarn?.grams ?? 0)), 0);
  const status: FitStatus = missing === 0 ? 'cabe' : missing <= ALMOST_GRAMS ? 'quase' : 'nao';
  return { model, slots: results, status, totalNeed, totalHave, missing, margin: totalHave - totalNeed };
}

export function rankModels(models: RugModel[], stash: Yarn[]): FitResult[] {
  const rank = { cabe: 0, quase: 1, nao: 2 };
  return models
    .map((m) => fitModel(m, stash))
    .sort((a, b) => rank[a.status] - rank[b.status] || a.missing - b.missing || b.totalNeed - a.totalNeed);
}
