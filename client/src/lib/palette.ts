// Category colours: [deep sky, mid sky, planet, accent]. Used by the generated
// covers, the hero orbit, chart bars and category dots so every view of a
// category shares one colour.
export const PALETTES: Record<string, [string, string, string, string]> = {
  Education: ["#13294a", "#3c6fb0", "#a6d1ff", "#f0a43a"],
  Healthcare: ["#4a1820", "#b4505c", "#ffd0c8", "#a6d1ff"],
  Environment: ["#0f2e24", "#3f7d5c", "#cfe8b4", "#f0a43a"],
  "Community Development": ["#0e2a2a", "#2e6a66", "#fbe3b8", "#f0a43a"],
  "Emergency Relief": ["#3a1312", "#b23a2e", "#ffd4a8", "#fbe3b8"],
  "Arts & Culture": ["#26173f", "#7b4fb0", "#f5c6e8", "#f0a43a"],
  "Sports & Recreation": ["#0c3434", "#1f8a86", "#b8f0e6", "#f0a43a"],
  Technology: ["#0d1a30", "#2f4e8c", "#9fe3ff", "#f0a43a"],
  "Animal Welfare": ["#38220f", "#a8693a", "#f7d9b0", "#a6d1ff"],
  "Human Rights": ["#241d33", "#5b4b8a", "#f2e3a6", "#a6d1ff"],
  Other: ["#102525", "#2b5b5b", "#a6d1ff", "#f0a43a"],
};


export function paletteFor(category: string) {
  return PALETTES[category] || PALETTES.Other;
}
