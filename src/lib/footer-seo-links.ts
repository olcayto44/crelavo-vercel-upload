export type FooterSeoLink = { label: string; href: string; hreflang?: string };
export type FooterSeoGroup = { title: string; links: FooterSeoLink[] };

export const footerSeoGroups: FooterSeoGroup[] = [
  {
    "title": "AI Tools",
    "links": [
      {
        "label": "AI Video Generator for E-Commerce",
        "href": "/tools/ai-video-generator-for-ecommerce"
      },
      {
        "label": "Product URL to Video AI",
        "href": "/tools/product-url-to-video-ai"
      },
      {
        "label": "AI UGC Ad Generator",
        "href": "/tools/ai-ugc-ad-generator"
      },
      {
        "label": "Amazon Product Video Tool AI",
        "href": "/tools/amazon-product-video-tool-ai"
      },
      {
        "label": "Talking Avatars for Ads",
        "href": "/tools/talking-avatars-for-ads"
      }
    ]
  },
  {
    "title": "Creative & Alternatives",
    "links": [
      {
        "label": "Canva Alternative",
        "href": "/alternatives/canva-alternative"
      },
      {
        "label": "CapCut AI Alternative",
        "href": "/alternatives/capcut-ai-alternative"
      },
      {
        "label": "AI Movies Generator",
        "href": "/tools/ai-movies-generator"
      },
      {
        "label": "AI Series Creator",
        "href": "/tools/ai-series-creator"
      },
      {
        "label": "AI Music Video Generator",
        "href": "/tools/ai-music-video-generator"
      }
    ]
  },
  {
    "title": "Resources & International",
    "links": [
      {
        "label": "Shopify Video Ad Guide",
        "href": "/blog/how-to-generate-shopify-product-videos-with-ai"
      },
      {
        "label": "Amazon Video Ad Guide",
        "href": "/blog/turn-amazon-product-links-into-video-ads"
      },
      {
        "label": "Consistent Style AI Movie Guide",
        "href": "/blog/how-to-create-ai-series-and-movies"
      },
      {
        "label": "Crelavo 中文 (ZH)",
        "href": "/zh/ai-video-generator",
        "hreflang": "zh-Hans"
      }
    ]
  }
];
