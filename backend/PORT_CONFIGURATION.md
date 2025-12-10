# Port Configuration

## Why Port 3001?

The CFA backend server uses **port 3001** instead of the traditional 5000 because:

1. **macOS AirPlay Receiver** uses port 5000 by default
2. The `ControlCenter` process on macOS continuously restarts on port 5000
3. This causes `EADDRINUSE` errors when trying to use port 5000

## Configuration

The port is configured in `.env`:
```bash
PORT=3001
```

## If You See Port Conflicts

### Error Message:
```
Error: listen EADDRINUSE: address already in use :::3001
```

### Solutions:

#### Option 1: Kill the Process Using the Port
```bash
# Find the process
lsof -i:3001

# Kill it
lsof -ti:3001 | xargs kill -9
```

#### Option 2: Use a Different Port
```bash
# Temporarily use another port
PORT=3002 npm run dev

# Or update .env file
echo "PORT=3002" >> .env
```

#### Option 3: On macOS - Disable AirPlay Receiver (if using port 5000)
1. Go to System Settings → General → AirDrop & Handoff
2. Toggle off "AirPlay Receiver"
3. Change `.env` back to `PORT=5000`

## Current Server Configuration

- **Development URL:** `http://localhost:3001`
- **Health Check:** `http://localhost:3001/api/health`
- **API Base:** `http://localhost:3001/api`

## Testing the Server

```bash
# Check if server is running
curl http://localhost:3001/api/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "2025-12-10T21:36:19.633Z",
#   "environment": "development"
# }
```

## Error Handling

The server includes improved error handling that will:
1. Detect port conflicts automatically
2. Provide helpful error messages
3. Suggest solutions
4. Support graceful shutdown (Ctrl+C)

## Related Files

- `.env` - Port configuration
- `.env.example` - Template with default port 3001
- `server.js` - Server setup with error handling
- `API_DOCUMENTATION.md` - All endpoints use port 3001
- `TESTING_GUIDE.md` - Testing examples use port 3001
