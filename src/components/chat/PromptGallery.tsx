"use client";

import { useState } from "react";

const CATEGORIES = [
  "Advertising & Marketing",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
] as const;

const CARDS = [
  {
    title: "Create a product promo",
    description: "Turn a product image into a polished advertising concept.",
    style: "from-[#efcaa2] via-[#f6e8d6] to-[#7992a8]",
    accent: "bg-[#151515]",
  },
  {
    title: "Make an AI video",
    description: "Build a cinematic short from a simple written idea.",
    style: "from-[#97918b] via-[#393735] to-[#111111]",
    accent: "bg-[#f3a63b]",
  },
  {
    title: "Design social content",
    description: "Create scroll-stopping visuals sized for your channels.",
    style: "from-[#88a2ff] via-[#d7d6ff] to-[#ffcfc1]",
    accent: "bg-[#7459ff]",
  },
  {
    title: "Edit a campaign image",
    description: "Restyle, clean up, or expand an existing visual.",
    style: "from-[#292a34] via-[#664553] to-[#d98d6f]",
    accent: "bg-[#f4efe9]",
  },
] as const;

export function PromptGallery() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    CATEGORIES[0],
  );

  return (
    <section className="mx-auto mt-[52px] w-full max-w-[1250px] px-2 pb-14">
      <div className="flex items-center justify-center gap-7 overflow-x-auto border-b border-black/8 px-2">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`relative shrink-0 px-1 pb-3 text-[13px] transition ${
              category === item
                ? "font-medium text-[#22221f] after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-px after:bg-[#22221f]"
                : "text-[#878783] hover:text-[#444440]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card, index) => (
          <article key={card.title} className="group min-w-0">
            <div
              className={`relative aspect-[1.24/1] overflow-hidden rounded-2xl bg-gradient-to-br ${card.style}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_26%,rgba(255,255,255,.5),transparent_30%)]" />
              <div className="absolute top-[16%] left-[12%] h-[62%] w-[76%] rotate-[-3deg] rounded-xl border border-white/30 bg-black/15 shadow-2xl backdrop-blur-[2px] transition duration-300 group-hover:scale-[1.02] group-hover:rotate-0">
                <div className="flex h-8 items-center gap-1.5 border-b border-white/20 px-3">
                  <span className="size-1.5 rounded-full bg-white/70" />
                  <span className="size-1.5 rounded-full bg-white/45" />
                  <span className="size-1.5 rounded-full bg-white/25" />
                </div>
                <div className="grid h-[calc(100%_-_2rem)] place-items-center">
                  <span
                    className={`grid size-12 place-items-center rounded-2xl text-xl text-white shadow-xl ${card.accent}`}
                  >
                    {index === 1 ? "▶" : index === 2 ? "Aa" : "✦"}
                  </span>
                </div>
              </div>
            </div>
            <h2 className="mt-3 truncate text-[14px] font-medium text-[#30302d]">
              {card.title}
            </h2>
            <p className="mt-1 line-clamp-1 text-[12px] text-[#8b8b87]">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
