// The Dream Spirits label artwork a customer can choose from. Each label's
// image lives in assets/labels/. `box` is where the blank "Dreamt Up
// Exclusively For" rectangle sits, as percentages of the image, measured from
// the artwork: its center (cx, cy), size (w, h), and the slight tilt of the
// torn-paper artboard in degrees (rot).

const TILTED_BOX = { cx: 81.47, cy: 26.4, w: 30.44, h: 16.63, rot: -0.73 };
const FLAT_BOX = { cx: 81.38, cy: 20.25, w: 30.6, h: 20, rot: 0 };

export const LABEL_GROUPS = ["Single Barrel", "Double Oaked", "Small Batch & Blends", "Evolution Barrel"];

export const LABEL_TYPES = [
  { key: "bourbon-single-barrel", group: "Single Barrel", name: "Bourbon — Single Barrel Cask Strength", box: TILTED_BOX },
  { key: "rye-single-barrel", group: "Single Barrel", name: "Rye — Single Barrel Cask Strength", box: TILTED_BOX },
  { key: "wheated-single-barrel", group: "Single Barrel", name: "Wheated Bourbon — Single Barrel Cask Strength", box: TILTED_BOX },
  { key: "light-whiskey-single-barrel", group: "Single Barrel", name: "American Light Whiskey — Single Barrel Cask Strength", box: TILTED_BOX },
  { key: "bottled-in-bond-bourbon", group: "Single Barrel", name: "Bottled-in-Bond Bourbon — Single Barrel", box: TILTED_BOX },
  { key: "apple-brandy-single-barrel", group: "Single Barrel", name: "Apple Brandy — Single Barrel Cask Strength", box: TILTED_BOX },

  { key: "bourbon-double-oaked", group: "Double Oaked", name: "Bourbon — Double Oaked", box: TILTED_BOX },
  { key: "bourbon-toasted-double-oaked", group: "Double Oaked", name: "Bourbon — Toasted Barrels, Double Oaked", box: TILTED_BOX },
  { key: "rye-double-oaked", group: "Double Oaked", name: "Rye — Double Oaked", box: TILTED_BOX },
  { key: "rye-toasted-double-oaked", group: "Double Oaked", name: "Rye — Toasted Barrels, Double Oaked", box: TILTED_BOX },
  { key: "light-whiskey-double-oaked", group: "Double Oaked", name: "American Light Whiskey — Double Oaked", box: FLAT_BOX },

  { key: "small-batch-bourbon", group: "Small Batch & Blends", name: "Small Batch Bourbon", box: TILTED_BOX },
  { key: "small-batch-bourbon-250", group: "Small Batch & Blends", name: "Small Batch Bourbon — 250 Edition", box: TILTED_BOX },
  { key: "small-batch-american-whiskies", group: "Small Batch & Blends", name: "Small Batch Whiskey — Blend of American Whiskies", box: TILTED_BOX },
  { key: "double-oaked-american-blend", group: "Small Batch & Blends", name: "Double Oaked Blend of American Whiskies", box: TILTED_BOX },
  { key: "ryebon", group: "Small Batch & Blends", name: "Mad Scientist Ryebon", box: TILTED_BOX },
  { key: "ryebon-toasted-double-oaked", group: "Small Batch & Blends", name: "Mad Scientist Ryebon — Toasted Barrels, Double Oaked", box: TILTED_BOX },

  { key: "evolution-bourbon", group: "Evolution Barrel", name: "Evolution Barrel — Bourbon", box: TILTED_BOX },
  { key: "evolution-rye", group: "Evolution Barrel", name: "Evolution Barrel — Rye", box: TILTED_BOX },
].map((t) => ({ ...t, image: `/src/assets/labels/${t.key}.jpg` }));

export const DEFAULT_LABEL_KEY = "bourbon-single-barrel";

// Unknown or missing keys (e.g. a pick made before label types existed) fall
// back to the default label.
export function getLabelType(key) {
  return LABEL_TYPES.find((t) => t.key === key) || LABEL_TYPES.find((t) => t.key === DEFAULT_LABEL_KEY);
}
