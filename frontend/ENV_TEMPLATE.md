# Environment Variables Template

Copy this content to create your `.env.development` file.

## Development Environment

Create file: `.env.development`

```bash
# API Configuration
VITE_API_URL=https://api.notaku.cloud

# Optional: Debug Mode
VITE_DEBUG=true
```

## Production Environment

Create file: `.env.production`

```bash
# API Configuration
VITE_API_URL=https://api.notaku.cloud

# Debug Mode (disabled in production)
VITE_DEBUG=false
```

## Local Backend (Optional)

If running backend locally:

```bash
# API Configuration (local)
VITE_API_URL=http://localhost:8000

# Debug Mode
VITE_DEBUG=true
```

## How to Create

```bash
# Navigate to frontend directory
cd frontend

# Create development environment file
cat > .env.development << 'EOF'
VITE_API_URL=https://api.notaku.cloud
VITE_DEBUG=true
EOF

# Verify file created
cat .env.development
```

## Verify Environment Variables

After creating the file, restart dev server and check:

```javascript
// In browser console
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should output: https://api.notaku.cloud
```
