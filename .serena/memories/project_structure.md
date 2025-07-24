# Project Structure

## Root Directory
```
calendrier-app/
├── .serena/              # Serena configuration and cache
│   ├── cache/           # Language server cache
│   ├── memories/        # Project memories
│   └── project.yml      # Serena project config
├── components/          # React components
│   ├── Calendar.tsx     # Main calendar component
│   ├── Calendar.module.css
│   ├── Ticket.tsx       # Draggable ticket component
│   └── Ticket.module.css
├── pages/               # Next.js pages
│   ├── _app.tsx         # App wrapper
│   └── index.tsx        # Home page with main logic
├── styles/              # Global styles
│   ├── globals.css      # Global CSS
│   └── Home.module.css  # Home page styles
├── .gitignore           # Git ignore file
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── package-lock.json    # Dependency lock file
├── tsconfig.json        # TypeScript configuration
└── claude-code-mcp-config.md  # MCP configuration guide
```

## Component Architecture
- **Calendar**: Displays monthly view, handles day cells and navigation
- **Ticket**: Draggable ticket component with color support
- **Home**: Main page that orchestrates ticket state and drag-drop logic

## Key Directories
- **/components**: Reusable UI components
- **/pages**: Next.js page components (routing)
- **/styles**: CSS modules and global styles
- **/.serena**: Serena-specific files (gitignored)