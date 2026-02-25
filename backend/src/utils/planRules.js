const normalizePlanKey = (value = "") => {
  const plan = String(value || "").trim().toLowerCase();

  if (["enterprise", "business", "corporate"].includes(plan)) return "enterprise";
  if (["pro", "standard", "premium", "growth"].includes(plan)) return "pro";
  if (["trial", "free", "basic", "starter"].includes(plan)) return "free";

  return "free";
};

const PLAN_RULES = {
  free: {
    key: "free",
    name: "Free / Trial",
    monthlyPriceAed: 0,
    maxUsers: 1,
    maxCustomDomains: 0,
    listingLimit: 25,
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPriceAed: 799,
    maxUsers: 10,
    maxCustomDomains: 1,
    listingLimit: 1000,
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    monthlyPriceAed: 2999,
    maxUsers: 100,
    maxCustomDomains: 5,
    listingLimit: 10000,
  },
};

const PLAN_ORDER = {
  free: 1,
  pro: 2,
  enterprise: 3,
};

const getPlanRules = (plan) => PLAN_RULES[normalizePlanKey(plan)] || PLAN_RULES.free;

const canUpgradePlan = (fromPlan, toPlan) => {
  const fromKey = normalizePlanKey(fromPlan);
  const toKey = normalizePlanKey(toPlan);
  return (PLAN_ORDER[toKey] || 0) > (PLAN_ORDER[fromKey] || 0);
};

module.exports = {
  PLAN_RULES,
  PLAN_ORDER,
  normalizePlanKey,
  getPlanRules,
  canUpgradePlan,
};
