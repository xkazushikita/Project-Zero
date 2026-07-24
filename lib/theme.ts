// Shared design tokens — the "Slash" style reference (docs/Design/DESIGN.md):
// near-black canvas, a serif display face for headings, Inter for everything else,
// and copper as the single warm accent.

export const colors = {
  obsidian: "#08080a", // page canvas
  onyx: "#040406", // card surface
  carbon: "#121317", // elevated panel
  graphite: "#1c1d22", // hairline borders
  slate: "#2e3038", // secondary borders
  smoke: "#464853", // tertiary / inactive
  ash: "#5e616e", // muted text
  steel: "#777a88", // button borders, icon strokes
  fog: "#9194a1", // nav text, descriptions
  mist: "#acafb9", // supplementary text
  silver: "#c7c9d1", // secondary headings
  bone: "#e2e3e9", // default body text
  paperWhite: "#ffffff", // primary actions, headings
  copper: "#cc9166", // the one accent color
  sage: "#8fb197", // desaturated positive/active status green
  errorRed: "#c9746f", // desaturated status red
  gildedGradient:
    "linear-gradient(103deg, rgb(174,147,87), rgb(255,240,204) 40%, rgb(174,147,87) 70%, rgba(189,157,79,0))",
};

export const fonts = {
  serif: "'Playfair Display', Georgia, serif", // Ivy Presto substitute
  sans: "Inter, system-ui, sans-serif",
};
