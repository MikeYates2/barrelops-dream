import { loginAsCustomer, loginAsStaff } from "../store.js";
import { el, card, button, field, textInput } from "../ui.js";
import { navigate } from "../router.js";

export function renderLogin() {
  let activeTab = "customer"; // 'customer' | 'staff'
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-5 w-full max-w-md" });

  const wrap = el("div", { class: "min-h-screen flex flex-col items-center justify-center px-6 py-16" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function draw() {
    errorBox.classList.add("hidden");

    const tabs = el("div", { class: "flex gap-1 p-1 rounded-full glass border border-white/10 mb-8" }, [
      el("button", {
        type: "button",
        class: `px-6 py-2 rounded-full text-sm tracking-wide transition-colors ${
          activeTab === "customer" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Customer",
        onclick: () => {
          activeTab = "customer";
          draw();
        },
      }),
      el("button", {
        type: "button",
        class: `px-6 py-2 rounded-full text-sm tracking-wide transition-colors ${
          activeTab === "staff" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Dream Staff",
        onclick: () => {
          activeTab = "staff";
          draw();
        },
      }),
    ]);

    const name = { value: "" };
    const email = { value: "" };
    const accessCode = { value: "" };

    const formCard =
      activeTab === "customer"
        ? card([
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Welcome."),
              el("p", { class: "text-sm text-ivory/40 mb-6" }, "Enter your details to browse the collection and track your picks."),
              el(
                "form",
                {
                  class: "space-y-5",
                  onsubmit: (e) => {
                    e.preventDefault();
                    if (!name.value.trim() || !email.value.trim()) {
                      showError("Please enter your name and email.");
                      return;
                    }
                    loginAsCustomer({ name: name.value.trim(), email: email.value.trim() });
                    navigate("/");
                  },
                },
                [
                  field("Full Name", textInput({ type: "text", oninput: (e) => (name.value = e.target.value) })),
                  field("Email", textInput({ type: "email", oninput: (e) => (email.value = e.target.value) })),
                  button("Continue as Customer", { variant: "gold", type: "submit", extraClass: "w-full mt-2" }),
                ]
              ),
            ]),
          ])
        : card([
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Staff Sign In"),
              el("p", { class: "text-sm text-ivory/40 mb-6" }, "For Dream Spirits team members only."),
              el(
                "form",
                {
                  class: "space-y-5",
                  onsubmit: (e) => {
                    e.preventDefault();
                    if (!name.value.trim() || !accessCode.value.trim()) {
                      showError("Please enter your name and access code.");
                      return;
                    }
                    const result = loginAsStaff({ name: name.value.trim(), accessCode: accessCode.value.trim() });
                    if (!result.ok) {
                      showError(result.error);
                      return;
                    }
                    navigate("/dashboard");
                  },
                },
                [
                  field("Full Name", textInput({ type: "text", oninput: (e) => (name.value = e.target.value) })),
                  field("Access Code", textInput({ type: "password", oninput: (e) => (accessCode.value = e.target.value) })),
                  button("Sign In", { variant: "gold", type: "submit", extraClass: "w-full mt-2" }),
                ]
              ),
            ]),
          ]);

    wrap.replaceChildren(
      el("img", { src: "/src/assets/dream-spirits-logo.png", alt: "Dream Spirits", class: "w-20 h-20 object-contain mb-6" }),
      el("div", { class: "text-center mb-10" }, [
        el("h1", { class: "font-serif text-4xl text-ivory mb-2" }, "Dream Spirits"),
        el("p", { class: "text-xs text-gold/70 uppercase tracking-[0.25em]" }, "Barrel Pick Ops"),
      ]),
      tabs,
      errorBox,
      el("div", { class: "w-full max-w-md" }, formCard)
    );
  }

  draw();
  return wrap;
}
