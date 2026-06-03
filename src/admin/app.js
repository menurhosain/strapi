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
    },
  },
};

const bootstrap = (app) => {
  injectGoogleLogin();
  watchSlugAutoFill();
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

export default {
  config,
  bootstrap,
};
