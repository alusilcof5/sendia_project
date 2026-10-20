import type { ActionPlan } from '@/lib/schemas';
import { assertNoDirectIdentifiers, findDirectIdentifiers } from '@/lib/privacy';

export const plansStorageKey = 'sendia-plans-v1';
export const previousPlansStorageKey = 'miradas-plans-v1';
export const approvedPlanStorageKey = 'sendia-ai-approved-plan-v1';
export const previousApprovedPlanStorageKey = 'miradas-ai-approved-plan-v1';

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
    const readList = (key: string): StoredPlan[] => {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(stored) ? stored.map(parseStoredPlan).filter((plan): plan is StoredPlan => plan !== null) : [];
    };
    const combined = [...readList(plansStorageKey), ...readList(previousPlansStorageKey)];
    const byId = new Map(combined.map((plan) => [plan.id, plan]));
    const plans = [...byId.values()];
    const approvedValue = localStorage.getItem(approvedPlanStorageKey) ?? localStorage.getItem(previousApprovedPlanStorageKey);
    if (approvedValue) {
      if (localStorage.getItem(approvedPlanStorageKey) === null) localStorage.setItem(approvedPlanStorageKey, approvedValue);
      const legacy: unknown = JSON.parse(approvedValue);
      if (isRecord(legacy) && typeof legacy.title === 'string' && typeof legacy.objective === 'string' &&
        typeof legacy.reviewDate === 'string' && Array.isArray(legacy.strategies)) {
        const now = new Date().toISOString();
        const migrated: StoredPlan = {
          id: typeof legacy.id === 'string' ? legacy.id : 'migrated-' + now,
          title: legacy.title,
          objective: legacy.objective,
          reviewDate: legacy.reviewDate,
          strategies: legacy.strategies.filter((strategy): strategy is StoredPlan['strategies'][number] => isRecord(strategy) &&
            typeof strategy.id === 'string' && typeof strategy.title === 'string' && typeof strategy.detail === 'string' &&
            typeof strategy.responsible === 'string' && typeof strategy.cadence === 'string'),
          status: legacy.status === 'active' ? 'approved' : legacy.status === 'pending-approval' ? 'pending-approval' : 'draft',
          source: 'ai', createdAt: typeof legacy.createdAt === 'string' ? legacy.createdAt : now, updatedAt: now, completedStrategies: [], reviews: [],
          ...(typeof legacy.indicator === 'string' ? { indicator: legacy.indicator } : {}),
          ...(typeof legacy.question === 'string' ? { question: legacy.question } : {}),
          ...(typeof legacy.why === 'string' ? { why: legacy.why } : {}),
        };
        const valid = parseStoredPlan(migrated);
        if (valid) byId.set(valid.id, valid);
      }
    }
    const result = [...byId.values()];
    if (result.length && (localStorage.getItem(plansStorageKey) === null || result.length !== readList(plansStorageKey).length)) {
      const serialized = JSON.stringify(result);
      if (!findDirectIdentifiers(serialized).length) localStorage.setItem(plansStorageKey, serialized);
    }
    return result;
  } catch {
    return [];
  }
}

export function writePlans(plans: StoredPlan[]) {
  assertNoDirectIdentifiers(JSON.stringify(plans));
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

export function deriveReviewDate(reviewIn: string, now = new Date()): string {
  const normalized = reviewIn.toLowerCase();
  const weeks = normalized.match(/(?:en|tras|después de)\s+(\d+)\s+semanas?/);
  const days = normalized.match(/(?:en|tras|después de)\s+(\d+)\s+días?/);
  const offsetDays = weeks ? Number(weeks[1]) * 7 : days ? Number(days[1]) : 7;
  const review = new Date(now.getFullYear(), now.getMonth(), now.getDate() + Math.min(Math.max(offsetDays, 1), 90));
  return `${review.getFullYear()}-${String(review.getMonth() + 1).padStart(2, '0')}-${String(review.getDate()).padStart(2, '0')}`;
}
