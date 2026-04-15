# <span style="color:#C9A94E">Etymon</span> — An Interactive Etymology Tree Explorer
<p align="center">
  <a href="https://etymon-explorer.vercel.app">
    <img src="https://img.shields.io/badge/Live-Demo-C9A94E?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="https://github.com/Paisley77/etymon-explorer/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-64748B?style=for-the-badge" alt="License"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React_Flow-FF007F?style=flat-square&logo=react&logoColor=white" alt="React Flow"/>
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_API-8A2BE2?style=flat-square&logo=anthropic&logoColor=white" alt="Claude"/>
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel AI SDK"/>
  <img src="https://img.shields.io/badge/Zod-3068B7?style=flat-square&logo=zod&logoColor=white" alt="Zod"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Neon-00E5BF?style=flat-square&logo=neon&logoColor=black" alt="Neon"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=npm&logoColor=white" alt="Zustand"/>
  <img src="https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white" alt="D3.js"/>
  <img src="https://img.shields.io/badge/Lucide-111827?style=flat-square&logo=lucide&logoColor=white" alt="Lucide"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

<p align="center">
  <img src="./etymon_canvas.png" alt="Etymon Infinite Canvas" width="800"/>
</p>

<p align="center">
  <i><span style="color:#F5E6D3">See how words evolve across 1000 years</span></i>
</p>

---

## About

**Etymon** is an immersive, AI-powered platform that transforms the history of language into a living, breathing visual experience. Every word carries the echoes of ancient tongues—Latin whispers, Greek philosophy, Proto-Germanic roots buried deep in time. This project was born from a fascination with etymology and a desire to make the invisible threads connecting language visible, touchable, and beautiful.

At its heart, Etymon offers an **infinite canvas** where English words bloom into glowing, branching trees. Each node pulses with life; each connection flows like ink along gilded bezier curves. Particles drift along ancestral pathways, tracing the direction of linguistic inheritance. Behind it all, a twinkling nebula drifts beneath a soundtrack of Gregorian chant. Feel the echoes of time and enjoy your journey! 

<p align="center">
  <img src="./word_panel.png" alt="Node Details Panel" width="400"/>
</p>

---

## Features

### AI-Powered Word Exploration
Search for any English word. Etymon queries **Claude** via a structured AI pipeline, caches the response to a cloud database, and renders the word as a radiant node containing:

- **Definition** and part of speech
- **Language** and historical era
- **Etymology** narrative
- **First recorded usage** (year)
- **Ancestors** — the ancient words it descended from
- **Descendants** — modern words that evolved from it

As you continue exploring related words, your **etymological family tree grows** organically across the infinite canvas.

### Intuitive Interactions
- **Pan & Zoom** — navigate the boundless canvas freely
- **Hover** — preview quick definitions
- **Click any node** — reveal a detailed slide-out panel with full etymology, related words, and metadata
- **Explore Branch** — instantly expand a word's descendants currently stored in the database
- **Find Shortest Path** — select any two words in the family tree, and a highlighted route appears with directional arrows tracing the exact chain of inheritance

### Connected Tree Selection
Click the **"Select Tree"** button to highlight an entire etymological family. **Drag the connected component anywhere** on the canvas.

### Time Travel Slider
Powered by **D3.js**, the timeline slider spans from **1200 AD to the present**. As you scrub through history, word spellings **morph gradually**, reflecting their historical forms across centuries.

### Visual & Sensory Design
| Element | Description |
|---------|-------------|
| **Glowing Nodes** | Color-coded by language era (gold, copper, parchment) |
| **Bezier Edges** | Smooth, flowing curves with directional particles |
| **Scribble Effect** | New AI-generated words fade in as if written by quill |
| **Nebula Background** | Floating, multi-layered particle system with twinkling dynamics and parallax depth |
| **Gregorian Soundscape** | Custom audio player with medieval chant to deepen immersion |
| **Spring Physics** | Smooth animations throughout every interaction |

---

## Tech Stack
| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14 (App Router), TypeScript (& XML), React Flow, Tailwind CSS, Framer Motion |
| **State** | Zustand (canvas viewport, tree state, API coordination) |
| **AI** | Claude (Anthropic), Vercel AI SDK, Zod schema validation |
| **Database** | PostgreSQL (Neon.tech), Prisma ORM |
| **Algorithms** | Modified Dijkstra (shortest path), BFS (connected components) |
| **Visualization** | D3.js (time slider), Canvas API (nebula), SVG, Lucide-React (icons) |
| **Deployment** | Vercel |

---

