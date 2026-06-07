import "./custom.css";

const config = {
  head: {
    title: "SAH Admin",
  },
  auth: {
    logo: "/favicon.png",
  },
  menu: {
    logo: "/favicon.png",
  },
  translations: {
    en: {
      "Auth.form.welcome.title": "Welcome to SAH Admin!",
      "Auth.form.welcome.subtitle": "Log in to your SAH admin account",
      "content-manager.components.LeftMenu.collection-types": "Post Types",
      "content-type-builder.menu.section.models.name": "Post Types",
      "content-manager.components.LeftMenu.single-types": "All Pages",
      "content-type-builder.menu.section.single-types.name": "All Pages",
    },
  },
};

// Edit this array to control the order of collection types in the sidebar.
// Use the Display Name of each collection exactly as shown in the admin.
// Collections not listed here will appear after the ones listed, alphabetically.
const COLLECTION_ORDER = [
  "Applicant",
  "Subcontractor",
  "News",
  "Project",
  "Service",
  "Team",
  "Location",
  "Industry",
  "Tags",
  "Contact",
  "Pages",
  "Job",
  "Scope",
  "Add CSS Code",
  "Add JS Code",
  "Newsletter subscriber",
  "User",
];

const COLLECTION_SINGLE_ORDER = [
  "Home",
  "About-us",
  "Career",
  "Contact",
  "Become a subcontractor",
  "Leadership",
  "Partners",
  "Projects",
  "Project Detail",
  "Services",
  "Service Details",
  "News",
  "News Details",
  "Register Contractor",
  "Register Applicant",
  "Login",
  "Forget Password",
  "Dashboard",
  "Apply contractor",
  "Apply recrutement",
];

const bootstrap = (app) => {
  injectGoogleLogin();
  watchSlugAutoFill();
  watchSidebarOrder();
};

function injectGoogleLogin() {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => waitForLoginForm();
  document.head.appendChild(script);
}

function waitForLoginForm() {
  const observer = new MutationObserver(() => {
    // Strapi admin login form has a submit button — use it as the anchor
    const isLoginPage = window.location.pathname.includes("/auth/login");

    if (!isLoginPage) {
      const existing = document.getElementById("google-signin-wrapper");
      if (existing) existing.remove();
      return;
    }

    const submitBtn = document.querySelector("form button[type='submit']");
    if (submitBtn && !document.getElementById("google-signin-wrapper")) {
      observer.disconnect();
      insertGoogleButton(submitBtn);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function insertGoogleButton(submitBtn) {
  const wrapper = document.createElement("div");
  wrapper.id = "google-signin-wrapper";
  wrapper.style.cssText =
    "margin-top:12px; display:flex; justify-content:center;";

  // Insert below the submit button
  submitBtn.parentNode.insertBefore(wrapper, submitBtn.nextSibling);

  window.google.accounts.id.initialize({
    client_id: process.env.STRAPI_ADMIN_GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: "popup",
  });

  window.google.accounts.id.renderButton(wrapper, {
    theme: "outline",
    size: "large",
    width: 320,
    text: "signin_with",
  });
}

async function handleCredentialResponse(googleResponse) {
  try {
    const res = await fetch("/api/admin-google-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleResponse.credential }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message = json?.error?.message || "Google login failed.";
      alert(message);
      return;
    }

    const { token } = json.data;

    // Strapi v5 reads the access token from localStorage as a JSON-stringified
    // string (getStoredToken does JSON.parse). The refresh cookie is already
    // set server-side (httpOnly), so only the access token goes here.
    localStorage.setItem("jwtToken", JSON.stringify(token));
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "/admin";
  } catch {
    alert("Network error during Google login. Please try again.");
  }
}

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setNativeValue(input, value) {
  // Trigger React's synthetic event system
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function watchSlugAutoFill() {
  let attached = false;

  const observer = new MutationObserver(() => {
    const isContentManager =
      window.location.pathname.includes("/content-manager/");
    if (!isContentManager) {
      attached = false;
      return;
    }

    const locale =
      new URLSearchParams(window.location.search).get("locale") || "en";
    if (locale !== "en") {
      attached = false;
      return;
    }

    // Some content types use "title", others use "name"
    const titleInput =
      document.querySelector('input[name="title"]') ||
      document.querySelector('input[name="name"]');
    const slugInput = document.querySelector('input[name="slug"]');
    if (!titleInput || !slugInput || attached) return;

    attached = true;
    titleInput.addEventListener("input", () => {
      // Only auto-fill when the slug is empty
      if (slugInput.value) return;
      setNativeValue(slugInput, toSlug(titleInput.value));
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

const SIDEBAR_LISTS = [
  {
    selector:
      'a[href*="/content-manager/collection-types/"], a[href*="/content-type-builder/content-types/"]',
    order: COLLECTION_ORDER,
  },
  {
    selector:
      'a[href*="/content-manager/single-types/"], a[href*="/content-type-builder/content-types/api::about-page"]',
    order: COLLECTION_SINGLE_ORDER,
  },
];

function watchSidebarOrder() {
  const watchedOls = new Set();
  let olObserver = new MutationObserver(() => reorderCollectionSidebar());

  const bodyObserver = new MutationObserver(() => {
    let allFound = true;

    SIDEBAR_LISTS.forEach(({ selector }) => {
      const anchor = document.querySelector(selector);
      const ol = anchor?.closest("ol");
      if (!ol) {
        allFound = false;
        return;
      }
      if (watchedOls.has(ol)) return;
      watchedOls.add(ol);
      olObserver.observe(ol, { childList: true });
    });

    if (watchedOls.size > 0) reorderCollectionSidebar();
    if (allFound) bodyObserver.disconnect();
  });

  const removalObserver = new MutationObserver(() => {
    for (const ol of watchedOls) {
      if (!document.contains(ol)) {
        olObserver.disconnect();
        olObserver = new MutationObserver(() => reorderCollectionSidebar());
        watchedOls.clear();
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        break;
      }
    }
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
  removalObserver.observe(document.body, { childList: true, subtree: true });
}

function reorderCollectionSidebar() {
  SIDEBAR_LISTS.forEach(({ selector, order }) => reorderOl(selector, order));
}

function reorderOl(selector, order) {
  const anchor = document.querySelector(selector);
  if (!anchor) return;
  const ol = anchor.closest("ol");
  if (!ol) return;

  const items = Array.from(ol.children);
  if (items.length === 0) return;

  const getLabel = (li) => {
    const el = li.querySelector('[style*="text-overflow"]');
    return el ? el.textContent.trim() : "";
  };

  const ordered = order
    .map((name) => items.find((li) => getLabel(li) === name))
    .filter(Boolean);
  const rest = items.filter((li) => !order.includes(getLabel(li)));
  const final = [...ordered, ...rest];

  if (final.every((li, i) => li === items[i])) return;

  final.forEach((li) => ol.appendChild(li));
}

export default {
  config,
  bootstrap,
};
