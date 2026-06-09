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
      "Auth.form.welcome.title": "Welcome to SAH subcontractor admin portal !",
      "Auth.form.welcome.subtitle":
        "Log in to your SAH subcntractor admin account",
      "content-manager.components.LeftMenu.collection-types":
        "Subcontractor Portal",
      "content-type-builder.menu.section.models.name": "Subcontractor Portal",
      "content-manager.components.LeftMenu.single-types": "All Pages",
      "content-type-builder.menu.section.single-types.name": "All Pages",
    },
  },
};

// Edit this array to control the order of collection types in the sidebar.
// Use the Display Name of each collection exactly as shown in the admin.
// Collections not listed here will appear after the ones listed, alphabetically.
const COLLECTION_ORDER = [
  "Subcontractors",
  "Subcontracted projects",
  "Location",
  "User",
];

const COLLECTION_SINGLE_ORDER = [
  "Dashboard",
  "Projects Page",
  "Register Subcontractor",
  "Apply Subcontractor",
  "Login",
  "Forget Password",
];

const bootstrap = (app) => {
  injectCustomCSS();
  injectGoogleLogin();
  watchSlugAutoFill();
  watchSidebarOrder();
};

function injectCustomCSS() {
  const style = document.createElement("style");
  style.textContent = `
    nav a *,
    nav button {
      font-size: 16px !important;
    }
    .dzFGjH {
      font-size: 16px !important;
    }
    .fEpWbz {
      font-size: 1.6rem !important;
      color: #060608 !important;
    }
    .fUIgBA {
      font-size: 20px !important;
    }
  `;
  document.head.appendChild(style);
}

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
      if (selector.includes("single-types")) {
        const sibling = ol.previousElementSibling;
        if (sibling) {
          const clone = sibling.cloneNode(true);
          const textNode = [...clone.querySelectorAll("*"), clone].find(
            (el) =>
              el.childNodes.length === 1 &&
              el.childNodes[0].nodeType === Node.TEXT_NODE,
          );
          if (textNode) textNode.childNodes[0].nodeValue = "Reuse Sections";
          const lastLabel = COLLECTION_SINGLE_ORDER.at(-1);
          const lastLi = Array.from(ol.children).find((li) => {
            const el = li.querySelector('[style*="text-overflow"]');
            return el && el.textContent.trim() === lastLabel;
          });
          clone.style.padding = "20px 10px";
          if (lastLi) lastLi.insertAdjacentElement("afterend", clone);
        }
      }
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
  SIDEBAR_LISTS.forEach(({ selector, order, restOrder }) =>
    reorderOl(selector, order, restOrder),
  );
}

function reorderOl(selector, order, restOrder = []) {
  const anchor = document.querySelector(selector);
  if (!anchor) return;
  const ol = anchor.closest("ol");
  if (!ol) return;

  const allItems = Array.from(ol.children);
  if (allItems.length === 0) return;

  const getLabel = (li) => {
    const el = li.querySelector('[style*="text-overflow"]');
    return el ? el.textContent.trim() : "";
  };

  const linkItems = allItems.filter((li) => li.querySelector("a"));
  const separators = allItems.filter((li) => !li.querySelector("a"));

  const ordered = order
    .map((name) => linkItems.find((li) => getLabel(li) === name))
    .filter(Boolean);
  const unordered = linkItems.filter((li) => !order.includes(getLabel(li)));
  const restOrdered = restOrder
    .map((name) => unordered.find((li) => getLabel(li) === name))
    .filter(Boolean);
  const remaining = unordered.filter((li) => !restOrder.includes(getLabel(li)));
  const final = [...ordered, ...separators, ...restOrdered, ...remaining];

  if (final.every((li, i) => li === allItems[i])) return;

  final.forEach((li) => ol.appendChild(li));
}

export default {
  config,
  bootstrap,
};
