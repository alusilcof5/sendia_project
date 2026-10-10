import type { ActionPlan } from '@/lib/schemas';

export const plansStorageKey = 'miradas-plans-v1';
export const legacyPlanStorageKey = 'miradas-ai-approved-plan-v1';

export type PlanStatus = 'draft' | 'pending-approval' | 'approved' | 'completed';
export type PlanReview = { id: string; note: string; savedAt: string };
export type StoredPlan = Omit<ActionPlan, 'status'> & {
  id: string;
  status: PlanStatus;
  source: 'ai' | 'demo';
  createdAt: string;
  updatedAt: string;
  completedStrategies: string[];
  reviews: PlanReview[];
  indicator?: string;
  question?: string;
  why?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStoredPlan(value: unknown): value is StoredPlan {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string' ||
    typeof value.objective !== 'string' || typeof value.reviewDate !== 'string' ||
    !['draft', 'pending-approval', 'approved', 'completed'].includes(String(value.status)) ||
    !Array.isArray(value.strategies) || !value.strategies.every((strategy) => isRecord(strategy) &&
      typeof strategy.id === 'string' && typeof strategy.title === 'string' && typeof strategy.detail === 'string' &&
      typeof strategy.responsible === 'string' && typeof strategy.cadence === 'string') ||
    !Array.isArray(value.completedStrategies) || !value.completedStrategies.every((id) => typeof id === 'string') ||
    !Array.isArray(value.reviews) || !value.reviews.every((review) => isRecord(review) && typeof review.id === 'string' && typeof review.note === 'string' && typeof review.savedAt === 'string')) return false;
  return value.source === 'ai' || value.source === 'demo';
}

export function parseStoredPlan(value: unknown): StoredPlan | null {
  return isStoredPlan(value) ? value : null;
}

export function readPlans(): StoredPlan[] {
  try {
    const stored = JSON.parse(localStorage.getItem(plansStorageKey) || '[]');
    const plans = Array.isArray(stored) ? stored.map(parseStoredPlan).filter((plan): plan is StoredPlan => plan !== null) : [];
    if (plans.length) return plans;

    // Migrate the previous prototype version without discarding its saved plan.
    const legacyValue = localStorage.getItem(legacyPlanStorageKey);
    if (!legacyValue) return [];
    const legacy: unknown = JSON.parse(legacyValue);
    if (!isRecord(legacy) || typeof legacy.title !== 'string' || typeof legacy.objective !== 'string' ||
      typeof legacy.reviewDate !== 'string' || !Array.isArray(legacy.strategies)) return [];
    const now = new Date().toISOString();
    const migrated: StoredPlan = {
      id: 'migrated-' + now,
      title: legacy.title,
      objective: legacy.objective,
      reviewDate: legacy.reviewDate,
      strategies: legacy.strategies.filter((strategy): strategy is StoredPlan['strategies'][number] => isRecord(strategy) &&
        typeof strategy.id === 'string' && typeof strategy.title === 'string' && typeof strategy.detail === 'string' &&
        typeof strategy.responsible === 'string' && typeof strategy.cadence === 'string'),
      status: legacy.status === 'active' ? 'approved' : legacy.status === 'pending-approval' ? 'pending-approval' : 'draft',
      source: 'ai', createdAt: now, updatedAt: now, completedStrategies: [], reviews: [],
      ...(typeof legacy.indicator === 'string' ? { indicator: legacy.indicator } : {}),
      ...(typeof legacy.question === 'string' ? { question: legacy.question } : {}),
      ...(typeof legacy.why === 'string' ? { why: legacy.why } : {}),
    };
    const valid = parseStoredPlan(migrated);
    if (!valid) return [];
    localStorage.setItem(plansStorageKey, JSON.stringify([valid]));
    return [valid];
  } catch {
    return [];
  }
}

export function writePlans(plans: StoredPlan[]) {
  localStorage.setItem(plansStorageKey, JSON.stringify(plans));
}

export function upsertPlan(plan: StoredPlan) {
  const plans = readPlans();
  const index = plans.findIndex((item) => item.id === plan.id);
  const next = index < 0 ? [plan, ...plans] : plans.map((item, current) => current === index ? plan : item);
  writePlans(next);
  return next;
}

type NewPlan = Omit<StoredPlan, 'id' | 'createdAt' | 'updatedAt' | 'completedStrategies' | 'reviews'> & Partial<Pick<StoredPlan, 'id' | 'createdAt' | 'completedStrategies' | 'reviews'>>;

export function makeStoredPlan(plan: NewPlan): StoredPlan {
  const now = new Date().toISOString();
  return { ...plan, id: plan.id || crypto.randomUUID(), createdAt: plan.createdAt || now, updatedAt: now, completedStrategies: plan.completedStrategies ?? [], reviews: plan.reviews ?? [] };
}
