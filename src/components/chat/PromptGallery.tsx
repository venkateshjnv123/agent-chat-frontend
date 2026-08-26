"use client";

import Image from "next/image";
import { useState } from "react";

const CATEGORIES = [
  "All",
  "Viral Video Formats",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
] as const;

const CARDS = [
  {
    title: "Create PPTs",
    description: "Turn any topic into a beautifully designed presentation",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787662857905__Create_PPTs_thumbnail.jpg",
  },
  {
    title: "Generate a Music Track",
    description: "Pick any vibe — turn it into an AI generated original track",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787662870588__Generate_a_Music_Track_thumbnail.jpg",
  },
  {
    title: "Global Pop Star Music Video",
    description: "Become the lead in a fast-cut, globe-trotting music video",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787576473690__Global_Pop_Star_Music_Video_thumbnail.jpg",
  },
  {
    title: "Fashion Lookbook",
    description: "Beat-synced Y2K editorial lookbook with rapid outfit changes",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787576531164__Fashion_Lookbook_thumbnail.jpg",
  },
  {
    title: "Multi-Shot Product Commercial",
    description: "Create a fast-cut, glossy commercial",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787572876277__Multi-Shot_Product_Commercial_thumbnail.jpg",
  },
  {
    title: "Glass Jar Editorial Portrait",
    description: "Striking, goldfish-filled fashion concept",
    image:
      "https://galaxy-prod.tlcdn.com/original-assets/image/galaxymainsiteexamples/explore_ideas/thumbnails/video_1787572876713__Glass_Jar_Editorial_Portrait_thumbnail.jpg",
  },
] as const;

export function PromptGallery() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  return (
    <section className="mx-auto mt-8 w-full max-w-[900px] px-2 pb-14 md:px-0">
      <div className="flex items-center justify-start gap-8 overflow-x-auto px-2 md:justify-center">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 px-1 py-2 text-[14px] leading-5 transition ${
              category === item
                ? "font-medium text-[#1b1b1b]"
                : "font-normal text-[#585858] hover:text-[#1b1b1b]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 md:mt-6 lg:grid-cols-3 lg:gap-y-5">
        {CARDS.map((card) => (
          <article
            key={card.title}
            className="group min-w-0 overflow-hidden rounded-[14px] border border-[#ededed] bg-white"
          >
            <div className="relative aspect-video overflow-hidden bg-[#f7f7f7]">
              <Image
                unoptimized
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                src={card.image}
                alt=""
                className="object-cover transition duration-300 group-hover:scale-[1.015]"
              />
            </div>
            <h2 className="mt-2 truncate px-2 text-[14px] leading-5 font-medium text-[#1b1b1b]">
              {card.title}
            </h2>
            <p className="line-clamp-1 px-2 pb-2 text-[14px] leading-5 text-[#585858]">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
