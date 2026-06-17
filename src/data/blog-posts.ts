import type { BlogPost } from "@/types/blog-post";

type FallbackBlogPost = Omit<BlogPost, "contentHtml" | "categories"> & {
  content: readonly string[];
};

const fallbackBlogPosts: readonly FallbackBlogPost[] = [
  {
    slug: "brixton-cromwell-1200x-first-ride",
    title: "Brixton Cromwell 1200X — first ride impressions",
    excerpt:
      "Classic lines, modern heart. We took the Cromwell 1200X out of Tallinn and into the first proper spring miles.",
    category: "Motorcycles",
    publishedAt: "2026-03-08",
    readTime: "6 min read",
    image: "/Brixton_Cromwell1200X_Lifestyle_2023-9.jpg",
    imageAlt: "Brixton Cromwell 1200X on a country road",
    author: "Motorock editorial",
    content: [
      "The Cromwell 1200X doesn't ask for attention — it earns it. Low bars, long tank, and that unmistakable British roadster silhouette. On paper it's retro; on the road it feels deliberate.",
      "Fire it up and the 1200cc twin settles into a lazy rumble that never feels nervous at traffic lights. Clutch action is light enough for city filtering, but the real story starts once you're out of town.",
      "We ran a mixed loop through secondary roads and coastal stretches. The riding position is committed without being punishing — weight sits low, and direction changes feel natural once you trust the front end.",
      "Brakes are progressive, suspension is tuned for real-world surfaces rather than track days, and the gearbox rewards decisive shifts. It's the kind of bike that makes you plan longer routes just because you can.",
      "If you're cross-shopping modern classics, the Cromwell 1200X is the one that still feels like a motorcycle first and a lifestyle product second. Come see it in the showroom — or book a test ride and make up your own mind.",
    ],
  },
  {
    slug: "riding-gear-for-estonian-seasons",
    title: "How to pick riding gear for Estonian seasons",
    excerpt:
      "From cold mornings to surprise rain — a practical layering guide for riders who actually go out, not just pose.",
    category: "Equipment",
    publishedAt: "2026-02-19",
    readTime: "5 min read",
    image: "/JRH10015_L23.webp",
    imageAlt: "Rider wearing layered motorcycle gear",
    author: "Motorock editorial",
    content: [
      "Estonian riding means planning for four seasons in one afternoon. The gear that works in July won't save you in April, and the best setup is always layered — not bulky.",
      "Start with a breathable base layer that moves moisture away from skin. Add a mid-layer you can zip open at fuel stops. Your outer shell should handle wind and rain without turning you into a sauna.",
      "For urban commuting, look for CE-rated protection in shoulders and elbows, reflective details that don't ruin the look, and a cut that works off the bike. For longer rides, prioritize cuff and collar sealing.",
      "Boots and gloves are where most riders compromise — don't. Cold hands kill concentration faster than a wet visor. Invest once, ride all year.",
      "We stock Pando Moto, Holyfreedom, and Johnny Reb because their kit is built for real miles, not catalog shoots. Visit the shop and we'll help you build a setup that matches how you actually ride.",
    ],
  },
  {
    slug: "mutt-rhodesian-small-bike-big-attitude",
    title: "Mutt Rhodesian — small bike, big attitude",
    excerpt:
      "Light, loud, and unapologetically fun. Why the Rhodesian keeps selling out before the weekend.",
    category: "Motorcycles",
    publishedAt: "2026-01-24",
    readTime: "4 min read",
    image: "/brixton-image.webp",
    imageAlt: "Custom-style motorcycle in an urban setting",
    author: "Motorock editorial",
    content: [
      "Mutt builds bikes for riders who want character without a second mortgage. The Rhodesian sits in that sweet spot — compact, muscular, and impossible to walk past without looking twice.",
      "It's not trying to be a tourer or a track weapon. It's a city brawler and a back-road toy. The ergonomics are upright, the wheelbase is short, and every input feels immediate.",
      "Customization is part of the appeal. Mutt's modular approach means you can evolve the bike as your riding changes — exhaust, bars, tail, foot controls — without starting from scratch.",
      "If your garage is tight and your standards aren't, the Rhodesian deserves a place on your shortlist. We keep selected models in stock — check the motorcycles section for current availability.",
    ],
  },
  {
    slug: "garage-essentials-every-rider-needs",
    title: "Garage essentials: tools every rider needs",
    excerpt:
      "Torque wrenches, tyre pressure, chain care — the baseline toolkit before you start chasing bolt-on upgrades.",
    category: "Garage",
    publishedAt: "2025-12-11",
    readTime: "7 min read",
    image: "/Crossfire-125.jpg",
    imageAlt: "Motorcycle maintenance in a home garage",
    author: "Motorock editorial",
    content: [
      "A good ride starts in the garage. You don't need a lift and a race-team cart to maintain a modern motorcycle — you need the right basics and the discipline to use them.",
      "Minimum viable toolkit: quality tyre pressure gauge, paddock stand or stable rear stand, torque wrench with common bike sizes, chain cleaning kit, and nitrile gloves you'll actually wear.",
      "Check tyre pressures cold, every week. Inspect chain slack and lubrication every 500 km or after rain. Fasteners creep; a quick visual walk-around before every ride costs thirty seconds and saves expensive surprises.",
      "We carry Makita and selected workshop tools because home mechanics deserve pro-grade gear too. Browse the tools section or ask in store — we'll point you to what fits your bike and your budget.",
    ],
  },
  {
    slug: "pando-moto-2026-collection-overview",
    title: "Pando Moto 2026 — what's new in the collection",
    excerpt:
      "New textiles, updated cuts, and the same rebel energy. A quick tour through the arrivals we're most excited about.",
    category: "Equipment",
    publishedAt: "2025-11-02",
    readTime: "5 min read",
    image: "/holyfreedom.jpg",
    imageAlt: "Premium motorcycle apparel display",
    author: "Motorock editorial",
    content: [
      "Pando Moto keeps pushing riding wear that looks like fashion but protects like gear. The 2026 collection refines fits, adds new seasonal colours, and improves ventilation where it matters.",
      "Highlights include updated textile jackets with better CE integration, slimmer riding jeans that don't scream 'armour', and base layers you'll wear off the bike.",
      "Sizing runs true to European cuts — fitted but not restrictive. If you're between sizes, consider how many layers you run in spring and autumn.",
      "The full collection is live in our equipment section. New arrivals move quickly — if you see your size, don't wait until the first warm weekend.",
    ],
  },
] as const;

function toBlogPost(post: FallbackBlogPost): BlogPost {
  const { content, ...rest } = post;

  return {
    ...rest,
    categories: [post.category],
    contentHtml: content.map((paragraph) => `<p>${paragraph}</p>`).join(""),
  };
}

export const blogPosts: readonly BlogPost[] = fallbackBlogPosts.map(toBlogPost);
