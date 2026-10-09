
export type GalleryProject = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  theme: "silver" | "electric" | "lime" | "violet";
  label: string;
};

export const projects: GalleryProject[] = [
  {
    id: "project-01",
    number: "01",
    title: "FORM",
    subtitle: "Where ideas take shape.",
    category: "BRAND EXPERIENCE",
    theme: "silver",
    label: "THE ART OF FORM",
  },
  {
    id: "project-02",
    number: "02",
    title: "PULSE",
    subtitle: "Built for what's next.",
    category: "DIGITAL EXPERIENCE",
    theme: "electric",
    label: "THE FUTURE IN MOTION",
  },
  {
    id: "project-03",
    number: "03",
    title: "VELOCITY",
    subtitle: "Made to move beyond.",
    category: "INTERACTIVE PLATFORM",
    theme: "lime",
    label: "ENERGY WITHOUT LIMITS",
  },
  {
    id: "project-04",
    number: "04",
    title: "DIMENSION",
    subtitle: "A different perspective.",
    category: "CREATIVE TECHNOLOGY",
    theme: "violet",
    label: "EXPLORE THE UNKNOWN",
  },
];
