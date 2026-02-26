import { headers } from "next/headers";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const DEFAULT_SAAS_HOME_URL = "https://www.luxury-uaeproperty.com";

export const getTenantHost = () => {
  const headerStore = headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = headerStore.get("host");
  return (forwardedHost || host || "").split(":")[0].trim().toLowerCase();
};

export const getSaasHomeUrl = () => {
  const value = process.env.NEXT_PUBLIC_SAAS_HOME_URL || process.env.SAAS_HOME_URL || DEFAULT_SAAS_HOME_URL;
  return (value || DEFAULT_SAAS_HOME_URL).trim().replace(/\/$/, "");
};

const fetchPublic = async (path, options = {}) => {
  const tenantHost = getTenantHost();
  const revalidate = Number.isFinite(options.revalidate) ? options.revalidate : undefined;
  const cache = revalidate === undefined ? (options.cache || "no-store") : undefined;

  /** @type {RequestInit & { next?: { revalidate: number } }} */
  const init = {
    method: "GET",
    headers: {
      "x-tenant-host": tenantHost,
    },
  };

  if (cache) {
    init.cache = cache;
  }

  if (typeof revalidate === "number") {
    init.next = { revalidate };
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
};

export async function getTenantWebsiteData() {
  const tenantHost = getTenantHost();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/public/website`, {
      method: "GET",
      headers: {
        "x-tenant-host": tenantHost,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (response.status === 404) {
    return {
      tenant: null,
      _notRegisteredTenant: true,
    };
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getPublicProperties() {
  const data = await fetchPublic("/api/public/properties", { revalidate: 10 });
  return Array.isArray(data?.properties) ? data.properties : [];
}

export async function getPublicPropertyById(id) {
  const safeId = String(id || "").trim();
  if (!safeId) return null;
  const data = await fetchPublic(`/api/public/properties/${safeId}`, { revalidate: 10 });
  return data?.property || null;
}

export async function getPublicAgents() {
  const data = await fetchPublic("/api/public/agents", { revalidate: 10 });
  return Array.isArray(data?.agents) ? data.agents : [];
}

export const createPageTitle = (tenantName, pageName) => {
  if (!tenantName) return "Real Estate Website";
  return pageName ? `${pageName} | ${tenantName}` : tenantName;
};
