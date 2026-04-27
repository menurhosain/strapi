const config = {};

const bootstrap = (app) => {
  injectGoogleLogin();
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

    // Strapi v5 admin reads token from both localStorage and cookie
    localStorage.setItem("jwtToken", JSON.stringify(token));
    localStorage.setItem("isLoggedIn", "true");
    document.cookie = `jwtToken=${token}; path=/; SameSite=Strict`;

    window.location.href = "/admin";
  } catch {
    alert("Network error during Google login. Please try again.");
  }
}

export default {
  config,
  bootstrap,
};
