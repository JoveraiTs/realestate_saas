const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

export async function loginTenantUser(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Login failed");
  }

  return data;
}

export async function submitLead(payload) {
  const response = await fetch(`${API_BASE_URL}/api/public/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to submit lead");
  }

  return data;
}

export async function getDashboardSummary(token) {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load dashboard data");
  }

  return data;
}

export async function getPlanUsage(token) {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/plan-usage`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load plan usage");
  }

  return data;
}

export async function upgradeTenantPlan(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/upgrade-plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to upgrade plan");
  }

  return data;
}

export async function getTenantProfile(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load profile");
  }

  return data;
}

export async function updateTenantProfile(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update profile");
  }

  return data;
}

export async function resetTenantPassword(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to reset password");
  }

  return data;
}

export async function getWebsiteSettings(token) {
  const response = await fetch(`${API_BASE_URL}/api/website/settings`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to load website settings");
  }

  return data;
}

export async function updateWebsiteSettings(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/website/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to update website settings");
  }

  return data;
}

export async function listTenantProperties(token) {
  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to load properties");
  }
  return Array.isArray(data?.properties) ? data.properties : [];
}

export async function createTenantProperty(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to create property");
  }
  return data;
}

export async function updateTenantProperty(token, id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-host": window.location.host,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to update property");
  }
  return data;
}

export async function deleteTenantProperty(token, id) {
  const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to delete property");
  }
  return data;
}

export async function uploadTenantPropertyCover(token, id, file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/properties/${id}/cover`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload cover photo");
  }
  return data;
}

export async function uploadTenantPropertyGallery(token, id, files) {
  const list = Array.isArray(files) ? files : [];
  const form = new FormData();
  list.forEach((file) => {
    if (file) form.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/api/properties/${id}/gallery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-host": window.location.host,
    },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload gallery images");
  }
  return data;
}
