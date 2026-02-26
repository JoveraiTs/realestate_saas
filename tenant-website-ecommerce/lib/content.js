export const getThemeTokens = (theme) => {
  if (theme === "gold") {
    return {
      "--bg": "#f6f4ef",
      "--surface": "#ffffff",
      "--text": "#1f2937",
      "--muted": "#6b7280",
      "--border": "#e5e7eb",
      "--primary": "#a16207",
      "--primary-contrast": "#ffffff",
    };
  }

  return {
    "--bg": "#0f172a",
    "--surface": "#111827",
    "--text": "#e5e7eb",
    "--muted": "#94a3b8",
    "--border": "#1f2937",
    "--primary": "#f59e0b",
    "--primary-contrast": "#111827",
  };
};

export const buildHighlights = (tenantName) => [
  `${tenantName} verified agency team`,
  "Premium listings across key communities",
  "Direct consultation and viewing support",
];

export const buildAgents = (tenantName = "Agency") => [
  {
    id: "a1",
    name: "Senior Property Advisor",
    specialization: "Luxury Residential",
    experience: "8+ years",
    bio: `${tenantName} specialist for premium apartments and penthouses.`,
  },
  {
    id: "a2",
    name: "Investment Consultant",
    specialization: "ROI & Portfolio",
    experience: "6+ years",
    bio: `Helps ${tenantName} clients evaluate high-performing property assets.`,
  },
  {
    id: "a3",
    name: "Villa Market Expert",
    specialization: "Prime Villas",
    experience: "10+ years",
    bio: `Advises ${tenantName} buyers on upscale villa communities.`,
  },
];
