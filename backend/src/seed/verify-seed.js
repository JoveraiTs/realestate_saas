require("dotenv").config();

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const TEST_ORIGIN = process.env.TEST_ORIGIN || "http://testrealty.localhost:3000";

const tenantAdmin = {
  email: process.env.TEST_TENANT_ADMIN_EMAIL || "admin@testrealty.com",
  password: process.env.TEST_TENANT_ADMIN_PASSWORD || "Admin@123",
};

const tenantStaff = {
  email: process.env.TEST_TENANT_STAFF_EMAIL || "staff@testrealty.com",
  password: process.env.TEST_TENANT_STAFF_PASSWORD || "Staff@123",
};

const expectedAdminPermissions = [
  "management.users.create",
  "management.users.edit",
  "management.users.delete",
  "management.bookings.edit",
];

const expectedStaffPermissions = [
  "management.users.access",
  "management.users.view",
  "management.bookings.access",
  "management.bookings.view",
];

const notExpectedForStaff = [
  "management.users.create",
  "management.users.edit",
  "management.users.delete",
  "management.bookings.edit",
];

const login = async ({ email, password }) => {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: TEST_ORIGIN,
    },
    body: JSON.stringify({ email, password }),
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = { error: "Non-JSON response" };
  }

  return { ok: response.ok, status: response.status, body };
};

const hasAll = (arr, needed) => needed.every((x) => arr.includes(x));
const hasNone = (arr, blocked) => blocked.every((x) => !arr.includes(x));

const run = async () => {
  try {
    console.log(`🔎 Verifying seed via ${BACKEND_URL}`);
    console.log(`🌍 Using Origin: ${TEST_ORIGIN}`);

    const adminResult = await login(tenantAdmin);
    if (!adminResult.ok) {
      console.error("❌ Admin login failed:", adminResult.status, adminResult.body);
      process.exitCode = 1;
      return;
    }

    const adminPermissions = adminResult.body?.user?.permissions || [];
    if (!hasAll(adminPermissions, expectedAdminPermissions)) {
      console.error("❌ Admin permissions are incomplete", adminPermissions);
      process.exitCode = 1;
      return;
    }

    const staffResult = await login(tenantStaff);
    if (!staffResult.ok) {
      console.error("❌ Staff login failed:", staffResult.status, staffResult.body);
      process.exitCode = 1;
      return;
    }

    const staffPermissions = staffResult.body?.user?.permissions || [];
    if (!hasAll(staffPermissions, expectedStaffPermissions)) {
      console.error("❌ Staff permissions are incomplete", staffPermissions);
      process.exitCode = 1;
      return;
    }

    if (!hasNone(staffPermissions, notExpectedForStaff)) {
      console.error("❌ Staff has admin-level permissions", staffPermissions);
      process.exitCode = 1;
      return;
    }

    console.log("✅ Seed verification passed");
    console.log("   Admin and Staff logins are working with expected permission separation");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exitCode = 1;
  }
};

run();
