import { el } from "../ui.js";

function toIso(d) {
  // Build the date string from local components — avoid toISOString(),
  // which converts to UTC first and can shift the calendar day by one
  // in timezones behind UTC.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Renders a month-view calendar. `selected` is a Set of ISO date strings.
// onToggle(isoDate) is called when a clickable day is clicked.
export function renderCalendar({ selected, onToggle, minDate }) {
  let viewDate = new Date();
  viewDate.setDate(1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? new Date(minDate) : today;

  const container = el("div", { class: "select-none" });

  function draw() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const header = el("div", { class: "flex items-center justify-between mb-3" }, [
      el("button", {
        type: "button",
        class: "w-8 h-8 rounded-lg hover:bg-white/[0.06] text-ivory/50 hover:text-gold-light transition-colors",
        textContent: "‹",
        onclick: () => {
          viewDate = new Date(year, month - 1, 1);
          draw();
        },
      }),
      el("span", { class: "font-serif text-lg text-ivory tracking-wide" }, monthLabel),
      el("button", {
        type: "button",
        class: "w-8 h-8 rounded-lg hover:bg-white/[0.06] text-ivory/50 hover:text-gold-light transition-colors",
        textContent: "›",
        onclick: () => {
          viewDate = new Date(year, month + 1, 1);
          draw();
        },
      }),
    ]);

    const dow = ["S", "M", "T", "W", "T", "F", "S"].map((d) =>
      el("div", { class: "text-[10px] text-ivory/30 text-center py-1 font-medium tracking-widest" }, d)
    );

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(el("div", {}));
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const iso = toIso(d);
      const isPast = d < min;
      const isSelected = selected.has(iso);
      cells.push(
        el(
          "button",
          {
            type: "button",
            disabled: isPast,
            class: `w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${
              isPast
                ? "text-ivory/15 cursor-not-allowed"
                : isSelected
                ? "bg-gradient-to-b from-gold-light to-gold-dark text-noir font-semibold shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                : "text-ivory/70 hover:bg-gold/10 hover:text-gold-light"
            }`,
            onclick: () => {
              if (isPast) return;
              onToggle(iso);
              draw();
            },
          },
          String(day)
        )
      );
    }

    container.replaceChildren(header, el("div", { class: "grid grid-cols-7 gap-1" }, [...dow, ...cells]));
  }

  draw();
  return container;
}
