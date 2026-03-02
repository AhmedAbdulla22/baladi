# Environment Variables Setup

This project now uses `.env.local` for API configuration instead of hardcoded values.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
The `.env.local` file contains:
- **Firebase Configuration**: All Firebase project settings
- **API Keys**: Gemini AI and Groq API keys

### 3. Development Server
Run the development server to properly inject environment variables:

```bash
npm run dev
```

The server will run on `http://localhost:3000` and automatically load environment variables from `.env.local`.

### 4. File Structure
```
├── .env.local          # Environment variables (DO NOT commit to version control)
├── config.js           # Configuration loader
├── dev-server.js       # Development server with env injection
├── script.js           # Main application logic (now uses config)
├── index.html          # HTML with config.js loaded before script.js
└── package.json        # Dependencies and scripts
```

### 5. Security Notes
- **Never commit `.env.local` to version control**
- Add `.env.local` to your `.gitignore` file
- In production, use your server/backend to inject these values securely

### 6. Production Deployment
For production, you should:
1. Use a proper build process (Webpack, Vite, etc.)
2. Inject environment variables at build time or through your server
3. Never expose API keys directly in client-side code in production

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `GROQ_API_KEY` | Groq API key |

## Usage in Code
```javascript
// Configuration is automatically loaded from window.ENV
const config = window.ENV;
const apiKey = config.geminiApiKey;
const firebaseConfig = config.firebase;
```
