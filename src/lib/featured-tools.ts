export type FeaturedTool = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  format: string;
  quality: string;
  description: string;
  highlights: string[];
  workflow: string[];
  assistantIdea: string;
  assistantMode: string;
  assistantCategory: string;
};

export const featuredTools: FeaturedTool[] = [
  {
    id: "ai-video-generator",
    title: "AI Video Generator",
    subtitle: "Prompt, image, script or product idea to social-ready video.",
    category: "Video & Motion",
    format: "9:16 / 16:9 video",
    quality: "720p, 1080p, premium direction",
    description: "Create AI videos for ads, social posts, product launches, explainers and cinematic scenes. Users can start from a prompt, product link, script, image reference, voice direction or uploaded materials.",
    highlights: ["Prompt-to-video", "Image-to-video", "Script-to-video", "Voice-over", "Subtitles", "Final MP4"],
    workflow: ["Describe the video idea", "Choose format and quality", "Upload references or product materials", "Confirm credits", "Track the production and download output"],
    assistantIdea: "AI video generator project",
    assistantMode: "media",
    assistantCategory: "video"
  },
  {
    id: "talking-video",
    title: "Talking Video",
    subtitle: "Avatar, person or panel-style talking video production.",
    category: "Avatar & Cloning",
    format: "Talking avatar / dialogue video",
    quality: "720p / 1080p option",
    description: "Produce talking videos with one person, multiple speakers, avatar-style presenters, regional clothing, own voice-over, subtitles and lip-sync style delivery planning.",
    highlights: ["1-8 speakers", "Own voice-over", "Lip-sync", "Subtitles", "Regional style", "Final MP4"],
    workflow: ["Choose speaker count", "Add script or voice direction", "Upload face/avatar/audio materials", "Select visual style", "Create a production record"],
    assistantIdea: "Advanced talking video project",
    assistantMode: "media",
    assistantCategory: "talking_video"
  },
  {
    id: "image-visual-pack",
    title: "Image & Visual Pack",
    subtitle: "Product visuals, posters, thumbnails, banners and asset packs.",
    category: "Brand, Visuals & Files",
    format: "PNG/JPG visual package",
    quality: "1080p, 2K, 4K direction",
    description: "Generate product visuals, campaign images, thumbnails, social posts, hero banners and reusable image packs with brand/style direction and final delivery notes.",
    highlights: ["Product visuals", "Social images", "Thumbnails", "Banners", "Visual variations", "ZIP package"],
    workflow: ["Pick visual type", "Upload references", "Choose output count", "Confirm delivery format", "Receive visual package"],
    assistantIdea: "Image and visual pack project",
    assistantMode: "media",
    assistantCategory: "image"
  },
  {
    id: "website-builder",
    title: "Website Builder",
    subtitle: "Landing pages, business sites and e-commerce pages with source delivery.",
    category: "Web, App & Software",
    format: "Website source + README",
    quality: "Responsive production package",
    description: "Create websites from a business idea, restaurant/cafe brief, campaign, product line or e-commerce concept. The delivery can include source guide, admin scope, deployment notes and final ZIP package.",
    highlights: ["Landing page", "Business site", "E-commerce", "Admin scope", "Source ZIP", "README"],
    workflow: ["Describe the business", "Choose page scope", "Select admin/e-commerce options", "Confirm source delivery", "Track production"],
    assistantIdea: "Website builder project",
    assistantMode: "project",
    assistantCategory: "website"
  },
  {
    id: "saas-app-builder",
    title: "SaaS / App Builder",
    subtitle: "SaaS dashboards, mobile apps and admin projects.",
    category: "Web, App & Software",
    format: "App/source package",
    quality: "Project-based delivery",
    description: "Plan and package SaaS products, dashboards, mobile app screens, admin panels, auth flows, billing screens and database notes with a clear production/delivery workflow.",
    highlights: ["SaaS dashboard", "Mobile app", "Admin panel", "Auth", "Billing", "Source guide"],
    workflow: ["Choose product type", "Select screens/features", "Define admin scope", "Pick delivery package", "Create production"],
    assistantIdea: "SaaS app builder project",
    assistantMode: "project",
    assistantCategory: "saas"
  },
  {
    id: "brand-files",
    title: "Brand & Files",
    subtitle: "Brand kits, pitch decks, PDFs, documents and reusable file packs.",
    category: "Brand, Visuals & Files",
    format: "Brand/file ZIP package",
    quality: "Editable package direction",
    description: "Create brand kits, social identity packs, pitch decks, proposals, PDFs, catalogs, README packages and reusable delivery bundles from a single production request.",
    highlights: ["Brand kit", "PDF", "Pitch deck", "Catalog", "README", "Final ZIP"],
    workflow: ["Pick file type", "Add brand/material references", "Choose output formats", "Confirm package", "Download delivery bundle"],
    assistantIdea: "Brand and files project",
    assistantMode: "brand",
    assistantCategory: "brand_kit"
  }
];

export function featuredToolById(id: string) {
  return featuredTools.find((tool) => tool.id === id) ?? null;
}
