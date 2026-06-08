# SystemForge

An AI-powered blueprint generation platform that transforms product ideas into structured technical plans, architecture, roadmaps, and implementation prompts.

## The Problem

Coming up with an idea is easy. Turning that idea into something developers can actually build is much harder.

After the initial idea, most people get stuck asking questions like:

* What features should I include?
* Who are the target users?
* What tech stack should I use?
* How should the system be designed?
* What should I build first?
* How do I create prompts that generate production-ready code?

Most AI tools answer these questions separately. SystemForge helps connect them together by turning a simple idea into a complete blueprint through a guided workflow.

---

## Features

### Idea Refinement

* Expands raw ideas into structured product concepts
* Identifies users, goals, and core features
* Supports iterative refinement

### Workflow Mapping

* Generates user journeys and workflow diagrams
* Visualizes application flows

### Tech Stack Recommendations

* Suggests frontend, backend, and database technologies
* Provides rationale for recommendations

### System Architecture

* Generates high-level architecture plans
* Defines system components and relationships

### Build Roadmap

* Creates phased development plans
* Generates implementation tasks and milestones

### Prompt Builder

* Produces AI-ready prompts for coding assistants
* Uses accumulated project context

### Persistent Blueprint State

* Maintains project context across all modules
* Keeps blueprint information synchronized

### Structured AI Outputs

* Uses LangChain and Zod for reliable, validated responses
* Reduces inconsistent AI outputs

---

## How to Use

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/systemforge.git
cd systemforge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
DATABASE_URL=your_database_url
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open the Application

Visit:

```text
http://localhost:3000
```

### 6. Generate a Blueprint

1. Enter a product idea
2. Refine the concept
3. Generate workflows
4. Review technology recommendations
5. Create system architecture
6. Generate a development roadmap
7. Generate implementation prompts

---

## Tech Stack

* Next.js 16
* React 19
* Tailwind CSS v4
* LangChain
* Google Gemini 2.5 Flash
* PostgreSQL
* Zustand
* React Flow
* Zod

---

## License

MIT License
