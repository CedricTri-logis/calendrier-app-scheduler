# Suggested Development Commands

## Development Server
```bash
npm run dev
```
Starts the Next.js development server with hot reloading.

## Production Build
```bash
npm run build
```
Creates an optimized production build.

## Production Server
```bash
npm run start
```
Starts the production server (requires build first).

## Package Management
```bash
npm install        # Install dependencies
npm install <pkg>  # Add new dependency
npm install -D <pkg>  # Add dev dependency
```

## TypeScript
TypeScript compilation is handled automatically by Next.js during dev/build.

## Git Commands (macOS/Darwin)
```bash
git status         # Check current status
git add .          # Stage all changes
git commit -m "message"  # Commit changes
git push           # Push to remote
git pull           # Pull from remote
```

## File System (macOS/Darwin)
```bash
ls -la            # List all files with details
cd <directory>    # Change directory
mkdir <name>      # Create directory
rm -rf <path>     # Remove directory/file
find . -name "*.tsx"  # Find files by pattern
grep -r "pattern" .   # Search in files
```

## Serena MCP Server
```bash
cd /Users/cedriclajoie/test/serena
uv run serena-mcp-server --project /Users/cedriclajoie/test/calendrier-app --transport sse --port 8000
```