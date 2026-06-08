/**
 * blueprintExporter.js
 * Assembles the full Zustand state snapshot into a structured markdown document.
 */

function formatTechStack(stack) {
  if (!stack) return "Tech stack not generated yet.";
  
  let lines = [];
  if (stack.frontend) lines.push(`- **Frontend**: ${stack.frontend.name} (${stack.frontend.reason})`);
  if (stack.backend) lines.push(`- **Backend**: ${stack.backend.name} (${stack.backend.reason})`);
  if (stack.infrastructure) lines.push(`- **Infrastructure**: ${stack.infrastructure.name} (${stack.infrastructure.reason})`);
  if (stack.styling) lines.push(`- **Styling**: ${stack.styling.name}`);
  
  return lines.join("\n");
}

function formatArchitecture(arch) {
  if (!arch || !arch.prd) return "System architecture not generated yet.";
  
  let lines = [];
  lines.push(`### Problem Statement\n${arch.prd.problemStatement}\n`);
  
  if (arch.prd.coreFeatures?.length) {
    lines.push(`### Core Features\n` + arch.prd.coreFeatures.map(f => `- ${f}`).join("\n") + `\n`);
  }
  if (arch.prd.targetUsers?.length) {
    lines.push(`### Target Users\n` + arch.prd.targetUsers.map(u => `- ${u}`).join("\n") + `\n`);
  }
  
  return lines.join("\n");
}

function formatMarketResearch(market) {
  if (!market || !market.competitors) return "Market research not generated yet.";
  
  let lines = [];
  lines.push(`### Competitors`);
  market.competitors.forEach(c => {
    lines.push(`- **${c.name}**: ${c.description} (Strengths: ${c.strengths})`);
  });
  
  if (market.target_customer) {
    lines.push(`\n### Target Customer\n- Demographics: ${market.target_customer.age_range}, ${market.target_customer.income_level}\n- Pain point: ${market.target_customer.pain_point}`);
  }
  
  return lines.join("\n");
}

function formatRoadmap(roadmap) {
  if (!roadmap || !Array.isArray(roadmap)) return "Build roadmap not generated yet.";
  
  return roadmap.map((stage, idx) => {
    let lines = [`### Phase ${idx + 1}: ${stage.stage}\n*${stage.description}*\n`];
    if (stage.tasks?.length) {
      lines.push(stage.tasks.map(t => `- [ ] ${t}`).join("\n"));
    }
    return lines.join("\n");
  }).join("\n\n");
}

export function generateMarkdown(state, format) {
  const title = state.blueprintV1?.product_summary || state.refinement?.productName || "SystemForge Project";
  const ideaSummary = state.refinement?.description || state.idea || "No idea provided.";
  
  const rules = `
- NEVER use class components. ALWAYS use Functional components.
- ALWAYS use TypeScript for new files if supported.
- Ensure strict error handling.
- Build incrementally.
`;

  const mdcFrontmatter = format === 'cursor' ? 
`---
description: SystemForge Generated Blueprint Rules
globs: *
---
` : '';

  const md = `${mdcFrontmatter}# Project: ${title}

## What we are building
${ideaSummary}

## Tech Stack
${formatTechStack(state.stack)}

## System Architecture
${formatArchitecture(state.architecture)}

${state.marketResearch ? `## Market Context\n${formatMarketResearch(state.marketResearch)}\n` : ''}
## Build Order
${formatRoadmap(state.roadmap)}

## AI Coding Rules
${rules}
`;

  return md;
}
