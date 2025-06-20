#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const MACHINE_READABLE_DIR = path.join(__dirname, 'machine-readable');
const HUMAN_READABLE_DIR = path.join(__dirname, 'human-readable');
const ASSETS_DIR = path.join(HUMAN_READABLE_DIR, 'assets');

// Store all Mermaid diagrams for asset generation
const mermaidDiagrams = [];

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(HUMAN_READABLE_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  await fs.mkdir(path.join(ASSETS_DIR, 'diagrams'), { recursive: true });
}

// Generate header with metadata
function generateHeader(title, sourceFile) {
  const timestamp = new Date().toISOString();
  return `# ${title}

> **Auto-generated document** - Do not edit directly!  
> Source: \`${sourceFile}\`  
> Generated: ${timestamp}

---

`;
}

// Generate table of contents
function generateTOC(sections) {
  let toc = '## Table of Contents\n\n';
  sections.forEach(section => {
    const anchor = section.toLowerCase().replace(/\s+/g, '-');
    toc += `- [${section}](#${anchor})\n`;
  });
  return toc + '\n';
}

// Add a Mermaid diagram to the collection and return markdown with reference
function addMermaidDiagram(name, content, inline = true) {
  const diagramId = `${name}-${mermaidDiagrams.length + 1}`;
  mermaidDiagrams.push({
    id: diagramId,
    name,
    content
  });
  
  if (inline) {
    return `\`\`\`mermaid\n${content}\n\`\`\``;
  } else {
    return `![${name}](./assets/diagrams/${diagramId}.svg)`;
  }
}

// Convert user flows to markdown with diagrams
async function generateUserFlowsDoc() {
  console.log('📋 Generating User Flows documentation...');
  
  const data = JSON.parse(await fs.readFile(path.join(MACHINE_READABLE_DIR, 'user-flows.json'), 'utf8'));
  let markdown = generateHeader('User Flows Documentation', 'docs/machine-readable/user-flows.json');
  
  const sections = ['Overview', 'User Flows', 'Interactive Elements', 'Error States'];
  markdown += generateTOC(sections);
  
  // Overview
  markdown += `## Overview

This document describes all user journeys through the NoSpoilers application, including:
- Step-by-step flows for different user types
- Interactive elements on each page
- Error states and edge cases

`;

  // User Flows
  markdown += '## User Flows\n\n';
  
  for (const [flowKey, flow] of Object.entries(data.flows)) {
    markdown += `### ${flow.name}\n\n`;
    markdown += `**ID:** \`${flow.id}\`  \n`;
    markdown += `**Description:** ${flow.description}\n\n`;
    
    // Generate Mermaid flowchart
    let diagramContent = 'flowchart TD\n';
    
    flow.steps.forEach((step, index) => {
      const nodeId = step.id.replace(/_/g, '');
      diagramContent += `    ${nodeId}["${step.name}"]\n`;
      
      if (index > 0) {
        const prevNodeId = flow.steps[index - 1].id.replace(/_/g, '');
        diagramContent += `    ${prevNodeId} --> ${nodeId}\n`;
      }
      
      // Add decision branches
      if (step.decisions) {
        step.decisions.forEach(decision => {
          const decisionId = `decision${index}`;
          diagramContent += `    ${nodeId} --> ${decisionId}{${decision.question}}\n`;
          
          decision.options.forEach((option, optIndex) => {
            const nextNode = option.next ? option.next.replace(/_/g, '') : `end${index}${optIndex}`;
            diagramContent += `    ${decisionId} -->|${option.choice}| ${nextNode}\n`;
          });
        });
      }
      
      // Add outcomes
      if (step.outcomes) {
        step.outcomes.forEach((outcome, outcomeIndex) => {
          const outcomeId = `outcome${index}${outcomeIndex}`;
          diagramContent += `    ${nodeId} --> ${outcomeId}[${outcome.result}]\n`;
          if (outcome.next) {
            const nextNode = outcome.next.replace(/_/g, '');
            diagramContent += `    ${outcomeId} --> ${nextNode}\n`;
          }
        });
      }
    });
    
    markdown += addMermaidDiagram(`user-flow-${flow.id}`, diagramContent) + '\n\n';
    
    // Steps detail table
    markdown += '#### Flow Steps\n\n';
    markdown += '| Step | Page | Actions | Validations |\n';
    markdown += '|------|------|---------|-------------|\n';
    
    flow.steps.forEach(step => {
      const actions = step.actions ? step.actions.join(', ') : '-';
      const validations = step.validations ? step.validations.join(', ') : '-';
      markdown += `| ${step.name} | ${step.page || '-'} | ${actions} | ${validations} |\n`;
    });
    
    markdown += '\n';
  }
  
  // Interactive Elements
  markdown += '## Interactive Elements\n\n';
  
  for (const [pageKey, page] of Object.entries(data.interactive_elements)) {
    markdown += `### ${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)} Page\n\n`;
    
    // Buttons
    if (page.buttons && page.buttons.length > 0) {
      markdown += '#### Buttons\n\n';
      markdown += '| Button | Type | Action | Location | Mobile |\n';
      markdown += '|--------|------|--------|----------|--------|\n';
      
      page.buttons.forEach(btn => {
        const mobile = btn.mobile_friendly ? '✅' : btn.mobile_only ? '📱 Only' : '❌';
        markdown += `| ${btn.text} | ${btn.type} | ${btn.action} | ${btn.location} | ${mobile} |\n`;
      });
      markdown += '\n';
    }
    
    // Inputs
    if (page.inputs && page.inputs.length > 0) {
      markdown += '#### Input Fields\n\n';
      page.inputs.forEach(input => {
        markdown += `- **${input.id}**: ${input.type} input\n`;
        markdown += `  - Placeholder: "${input.placeholder}"\n`;
        if (input.features) {
          markdown += `  - Features: ${input.features.join(', ')}\n`;
        }
        if (input.validations) {
          markdown += `  - Validations: ${input.validations.join(', ')}\n`;
        }
        markdown += '\n';
      });
    }
    
    // Other elements
    if (page.videos) {
      markdown += '#### Videos\n\n';
      page.videos.forEach(video => {
        markdown += `- **${video.id}** in ${video.location}\n`;
        markdown += `  - Controls: ${video.controls.join(', ')}\n`;
        markdown += `  - Autoplay: ${video.autoplay ? 'Yes' : 'No'}, Muted: ${video.muted ? 'Yes' : 'No'}\n\n`;
      });
    }
  }
  
  // Error States
  markdown += '## Error States\n\n';
  markdown += '| Error | Pages | Message | Handling |\n';
  markdown += '|-------|-------|---------|----------|\n';
  
  for (const [errorKey, error] of Object.entries(data.error_states)) {
    const pages = Array.isArray(error.pages) ? error.pages.join(', ') : error.page;
    markdown += `| ${errorKey} | ${pages} | ${error.message} | ${error.action} |\n`;
  }
  
  await fs.writeFile(path.join(HUMAN_READABLE_DIR, 'USER_FLOWS.md'), markdown);
  console.log('✅ User Flows documentation generated');
}

// Convert system diagram to markdown with visual representations
async function generateSystemDiagramDoc() {
  console.log('📐 Generating System Diagram documentation...');
  
  const data = JSON.parse(await fs.readFile(path.join(MACHINE_READABLE_DIR, 'system-diagram.json'), 'utf8'));
  let markdown = generateHeader('System Architecture Diagram', 'docs/machine-readable/system-diagram.json');
  
  const sections = ['Component Overview', 'API Routes', 'Data Flow', 'Database Schema', 'State Management', 'Deployment'];
  markdown += generateTOC(sections);
  
  // Component Overview
  markdown += `## Component Overview

### Frontend Architecture

`;

  let frontendDiagram = `graph TB
    subgraph "Pages"
        HomePage[HomePage /]
        VotePage[VotePage /vote]
        ResultsPage[ResultsPage /results]
        AdminPage[AdminPage /admin]
    end
    
    subgraph "Components"
        VotingInterface[VotingInterface]
        MovieSearch[MovieSearch]
        Results[Results]
    end
    
    subgraph "Hooks"
        WebSocket[useWebSocket]
    end
    
    HomePage --> DemoVideo[DemoVideoGallery]
    VotePage --> VotingInterface
    VotingInterface --> MovieSearch
    ResultsPage --> Results
    Results --> WebSocket
    VotingInterface --> WebSocket`;

  markdown += addMermaidDiagram('frontend-architecture', frontendDiagram) + '\n\n';

  // Pages table
  markdown += '### Pages\n\n';
  markdown += '| Path | Component | Purpose | State Type |\n';
  markdown += '|------|-----------|---------|------------|\n';
  
  data.components.frontend.pages.forEach(page => {
    markdown += `| ${page.path} | ${page.component} | ${page.purpose} | ${page.state} |\n`;
  });
  
  markdown += '\n### Components\n\n';
  
  data.components.frontend.components.forEach(comp => {
    markdown += `#### ${comp.id}\n\n`;
    markdown += `- **File:** \`${comp.file}\`\n`;
    markdown += `- **State:** ${comp.state ? comp.state.join(', ') : 'None'}\n`;
    if (comp.props && comp.props.length > 0) {
      markdown += `- **Props:** ${comp.props.join(', ')}\n`;
    }
    if (comp.api_calls && comp.api_calls.length > 0) {
      markdown += `- **API Calls:** ${comp.api_calls.join(', ')}\n`;
    }
    markdown += '\n';
  });
  
  // API Routes
  markdown += '## API Routes\n\n';
  markdown += '| Endpoint | Methods | Purpose | Auth Required |\n';
  markdown += '|----------|---------|---------|---------------|\n';
  
  data.components.backend.api_routes.forEach(route => {
    const auth = route.authentication ? '🔒 Yes' : '❌ No';
    markdown += `| ${route.path} | ${route.methods.join(', ')} | ${route.purpose || route.file} | ${auth} |\n`;
  });
  
  // Data Flow Diagrams
  markdown += '\n## Data Flow\n\n';
  
  data.data_flow.forEach(flow => {
    markdown += `### ${flow.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`;
    markdown += `**Trigger:** ${flow.trigger}\n\n`;
    
    let sequenceDiagram = 'sequenceDiagram\n';
    sequenceDiagram += '    participant User\n';
    sequenceDiagram += '    participant Frontend\n';
    sequenceDiagram += '    participant API\n';
    sequenceDiagram += '    participant Database\n';
    sequenceDiagram += '    participant External\n\n';
    
    flow.steps.forEach((step, index) => {
      if (step.component) {
        sequenceDiagram += `    User->>Frontend: ${step.action}\n`;
      } else if (step.endpoint) {
        sequenceDiagram += `    Frontend->>API: ${step.action}\n`;
      } else if (step.database) {
        sequenceDiagram += `    API->>Database: ${step.action}\n`;
      } else if (step.service) {
        sequenceDiagram += `    API->>External: ${step.action} (${step.service})\n`;
      } else if (step.websocket) {
        sequenceDiagram += `    API-->>Frontend: ${step.action} (WebSocket)\n`;
      } else if (step.navigation) {
        sequenceDiagram += `    Frontend->>User: ${step.action}\n`;
      }
    });
    
    markdown += addMermaidDiagram(`data-flow-${flow.id}`, sequenceDiagram) + '\n\n';
  });
  
  // Database Schema
  markdown += '## Database Schema\n\n';
  
  let erDiagram = 'erDiagram\n';
  
  data.components.database.tables.forEach(table => {
    erDiagram += `    ${table.name} {\n`;
    table.fields.forEach(field => {
      erDiagram += `        string ${field}\n`;
    });
    erDiagram += '    }\n';
  });
  
  // Add relationships
  data.components.database.tables.forEach(table => {
    if (table.relations) {
      table.relations.forEach(rel => {
        const [fromTable] = table.name;
        const [toTable, toField] = rel.references.split('.');
        erDiagram += `    ${table.name} ||--o{ ${toTable} : "${rel.field}"\n`;
      });
    }
  });
  
  markdown += addMermaidDiagram('database-schema', erDiagram) + '\n\n';
  
  // State Management
  markdown += '## State Management\n\n';
  markdown += '### Client-Side State\n\n';
  
  markdown += '#### React Component State\n\n';
  markdown += '| Component | State Variables | Purpose |\n';
  markdown += '|-----------|----------------|----------|\n';
  
  data.state_management.client_side.react_state.forEach(item => {
    markdown += `| ${item.component} | ${item.state.join(', ')} | Component-specific UI state |\n`;
  });
  
  markdown += '\n#### Local Storage\n\n';
  markdown += '| Key | Type | Purpose |\n';
  markdown += '|-----|------|----------|\n';
  
  data.state_management.client_side.local_storage.forEach(item => {
    markdown += `| ${item.key} | ${item.type} | ${item.purpose} |\n`;
  });
  
  // Deployment Architecture
  markdown += '\n## Deployment\n\n';
  markdown += '### Environment Configuration\n\n';
  
  markdown += '| Environment | Database | API | WebSocket |\n';
  markdown += '|-------------|----------|-----|------------|\n';
  
  for (const [env, config] of Object.entries(data.deployment_architecture.environments)) {
    markdown += `| ${env} | ${config.database} | ${config.api} | ${config.websocket} |\n`;
  }
  
  await fs.writeFile(path.join(HUMAN_READABLE_DIR, 'SYSTEM_DIAGRAM.md'), markdown);
  console.log('✅ System Diagram documentation generated');
}

// Convert business logic to markdown with decision trees
async function generateBusinessLogicDoc() {
  console.log('📊 Generating Business Logic documentation...');
  
  const data = JSON.parse(await fs.readFile(path.join(MACHINE_READABLE_DIR, 'business-logic.json'), 'utf8'));
  let markdown = generateHeader('Business Logic Documentation', 'docs/machine-readable/business-logic.json');
  
  const sections = ['Core Purpose', 'Business Rules', 'Algorithms', 'Invariants', 'Priorities', 'Constraints'];
  markdown += generateTOC(sections);
  
  // Core Purpose
  markdown += `## Core Purpose

> ${data.core_purpose}

`;

  // Business Rules
  markdown += '## Business Rules\n\n';
  
  for (const [category, rules] of Object.entries(data.rules)) {
    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Rules\n\n`;
    
    for (const [ruleKey, rule] of Object.entries(rules)) {
      markdown += `#### ${rule.id}\n\n`;
      markdown += `**Description:** ${rule.description}\n\n`;
      
      markdown += '| Aspect | Details |\n';
      markdown += '|--------|----------|\n';
      markdown += `| Implementation | ${rule.implementation} |\n`;
      markdown += `| Enforcement | ${rule.enforcement} |\n`;
      if (rule.error_message) {
        markdown += `| Error Message | "${rule.error_message}" |\n`;
      }
      markdown += `| Testable | ${rule.testable ? '✅ Yes' : '❌ No'} |\n`;
      if (rule.test_reference) {
        markdown += `| Test File | \`${rule.test_reference}\` |\n`;
      }
      markdown += '\n';
    }
  }
  
  // Algorithms
  markdown += '## Algorithms\n\n';
  
  for (const [algoKey, algo] of Object.entries(data.algorithms)) {
    markdown += `### ${algo.name}\n\n`;
    markdown += `**ID:** \`${algo.id}\`  \n`;
    markdown += `**Description:** ${algo.description}\n\n`;
    
    if (algo.implementation_steps) {
      markdown += '#### Implementation Flow\n\n';
      
      let flowDiagram = 'flowchart TD\n';
      
      algo.implementation_steps.forEach((step, index) => {
        const nodeId = `step${step.step}`;
        flowDiagram += `    ${nodeId}["Step ${step.step}: ${step.action}"]\n`;
        
        if (index > 0) {
          const prevNodeId = `step${algo.implementation_steps[index - 1].step}`;
          flowDiagram += `    ${prevNodeId} --> ${nodeId}\n`;
        }
        
        if (step.condition) {
          const decisionId = `decision${step.step}`;
          flowDiagram += `    ${nodeId} --> ${decisionId}{${step.condition}}\n`;
          flowDiagram += `    ${decisionId} -->|Yes| winner[Declare Winner]\n`;
          flowDiagram += `    ${decisionId} -->|No| step${step.step + 1}\n`;
        }
      });
      
      markdown += addMermaidDiagram(`algorithm-${algo.id}`, flowDiagram) + '\n\n';
    }
    
    if (algo.edge_cases) {
      markdown += '#### Edge Cases\n\n';
      markdown += '| Case | Result | Handling |\n';
      markdown += '|------|--------|----------|\n';
      
      algo.edge_cases.forEach(edge => {
        markdown += `| ${edge.case} | ${edge.result} | ${edge.handling || edge.rationale || '-'} |\n`;
      });
      markdown += '\n';
    }
    
    if (algo.formula) {
      markdown += `#### Formula\n\n\`\`\`\n${algo.formula}\n\`\`\`\n\n`;
    }
    
    if (algo.examples) {
      markdown += '#### Examples\n\n';
      markdown += '| Position | Total Movies | Points |\n';
      markdown += '|----------|--------------|--------|\n';
      
      algo.examples.forEach(ex => {
        markdown += `| ${ex.position} | ${ex.movies} | ${ex.points} |\n`;
      });
      markdown += '\n';
    }
  }
  
  // Invariants
  markdown += '## Invariants\n\n';
  markdown += 'These are conditions that must **always** be true:\n\n';
  
  for (const [invKey, inv] of Object.entries(data.invariants)) {
    markdown += `### ${inv.id}\n\n`;
    markdown += `> ${inv.description}\n\n`;
    markdown += `- **Implementation:** ${inv.implementation}\n`;
    if (inv.verification) {
      markdown += `- **Verification:** ${inv.verification}\n`;
    }
    if (inv.exception) {
      markdown += `- **Exception:** ${inv.exception}\n`;
    }
    markdown += '\n';
  }
  
  // Priorities
  markdown += '## Priorities\n\n';
  
  if (data.priorities.features) {
    markdown += '### Feature Priorities\n\n';
    markdown += '| Feature | Priority | Description | Rationale |\n';
    markdown += '|---------|----------|-------------|------------|\n';
    
    data.priorities.features.forEach(feat => {
      markdown += `| ${feat.feature} | **${feat.priority}** | ${feat.description} | ${feat.rationale} |\n`;
    });
    markdown += '\n';
  }
  
  if (data.priorities.performance) {
    markdown += '### Performance Requirements\n\n';
    markdown += '| Metric | Target | Priority |\n';
    markdown += '|--------|--------|----------|\n';
    
    data.priorities.performance.forEach(perf => {
      markdown += `| ${perf.metric} | ${perf.target} | ${perf.priority} |\n`;
    });
    markdown += '\n';
  }
  
  // Constraints
  markdown += '## Constraints\n\n';
  
  for (const [constraintType, constraints] of Object.entries(data.constraints)) {
    markdown += `### ${constraintType.charAt(0).toUpperCase() + constraintType.slice(1)} Constraints\n\n`;
    
    constraints.forEach(constraint => {
      markdown += `#### ${constraint.constraint}\n\n`;
      if (constraint.limit) {
        markdown += `- **Limit:** ${constraint.limit}\n`;
      }
      if (constraint.rationale) {
        markdown += `- **Rationale:** ${constraint.rationale}\n`;
      }
      if (constraint.mitigation) {
        markdown += `- **Mitigation:** ${constraint.mitigation}\n`;
      }
      if (constraint.implication) {
        markdown += `- **Implication:** ${constraint.implication}\n`;
      }
      markdown += '\n';
    });
  }
  
  await fs.writeFile(path.join(HUMAN_READABLE_DIR, 'BUSINESS_LOGIC.md'), markdown);
  console.log('✅ Business Logic documentation generated');
}

// Generate Mermaid diagram files as SVG
async function generateMermaidAssets() {
  console.log('🎨 Generating diagram assets...');
  
  // Create a summary file with all diagrams
  let mermaidHtml = `<!DOCTYPE html>
<html>
<head>
    <title>NoSpoilers Diagrams</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({ startOnLoad: true });</script>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .diagram-container { margin: 30px 0; padding: 20px; border: 1px solid #ddd; }
      h2 { color: #333; }
      .mermaid { background: white; }
    </style>
</head>
<body>
<h1>NoSpoilers Architecture Diagrams</h1>
`;

  mermaidDiagrams.forEach(diagram => {
    mermaidHtml += `
<div class="diagram-container">
  <h2>${diagram.name}</h2>
  <div class="mermaid" id="${diagram.id}">
${diagram.content}
  </div>
</div>
`;
  });

  mermaidHtml += `
<script>
  // Export diagrams as SVG (manual process - open in browser and save)
  window.addEventListener('load', function() {
    document.querySelectorAll('.mermaid').forEach(function(element) {
      console.log('Diagram ' + element.id + ' rendered');
    });
  });
</script>
</body>
</html>`;

  await fs.writeFile(path.join(ASSETS_DIR, 'diagrams.html'), mermaidHtml);
  
  // Also save raw mermaid definitions
  const mermaidDefinitions = mermaidDiagrams.map(d => ({
    id: d.id,
    name: d.name,
    definition: d.content
  }));
  
  await fs.writeFile(
    path.join(ASSETS_DIR, 'mermaid-definitions.json'), 
    JSON.stringify(mermaidDefinitions, null, 2)
  );
  
  console.log('✅ Diagram assets generated');
  console.log(`   📄 View diagrams: ${path.join(ASSETS_DIR, 'diagrams.html')}`);
  console.log(`   📊 Mermaid definitions: ${path.join(ASSETS_DIR, 'mermaid-definitions.json')}`);
}

// Generate index file
async function generateIndex() {
  console.log('📚 Generating documentation index...');
  
  const indexContent = `# NoSpoilers Documentation Index

> Auto-generated documentation from machine-readable source files

## Available Documents

### 📋 [User Flows](./USER_FLOWS.md)
Complete user journey maps, interactive elements catalog, and error states.

### 📐 [System Architecture](./SYSTEM_DIAGRAM.md)
Component diagrams, API routes, data flows, and deployment architecture.

### 📊 [Business Logic](./BUSINESS_LOGIC.md)
Business rules, algorithms, invariants, and priorities.

## Visual Assets

### 🎨 [Interactive Diagrams](./assets/diagrams.html)
View all architecture diagrams in an interactive format.

## Source Files

All documentation is generated from JSON files in \`docs/machine-readable/\`:
- \`user-flows.json\` - User interaction flows and UI elements
- \`system-diagram.json\` - Technical architecture and components
- \`business-logic.json\` - Business rules and algorithms

## Regenerating Documentation

To regenerate all documentation after modifying source files:

\`\`\`bash
npm run generate-docs
\`\`\`

To watch for changes and auto-regenerate:

\`\`\`bash
npm run generate-docs:watch
\`\`\`

---

*Last generated: ${new Date().toISOString()}*
`;

  await fs.writeFile(path.join(HUMAN_READABLE_DIR, 'README.md'), indexContent);
  console.log('✅ Documentation index generated');
}

// Main generation function
async function generateAllDocs() {
  console.log('🚀 Starting documentation generation...\n');
  
  // Clear diagrams array for fresh generation
  mermaidDiagrams.length = 0;
  
  try {
    await ensureDirectories();
    await generateUserFlowsDoc();
    await generateSystemDiagramDoc();
    await generateBusinessLogicDoc();
    await generateMermaidAssets();
    await generateIndex();
    
    console.log('\n✨ All documentation generated successfully!');
    console.log(`📁 Output location: ${HUMAN_READABLE_DIR}`);
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

// Watch mode
async function watchFiles() {
  console.log('👀 Watching for changes in machine-readable files...\n');
  
  const chokidar = require('chokidar');
  const watcher = chokidar.watch(path.join(MACHINE_READABLE_DIR, '*.json'), {
    persistent: true
  });
  
  watcher.on('change', async (filepath) => {
    console.log(`\n📝 Detected change in ${path.basename(filepath)}`);
    await generateAllDocs();
  });
}

// CLI handling
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  generateAllDocs().then(() => watchFiles());
} else {
  generateAllDocs();
}