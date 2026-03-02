// Environment configuration using Vite
const config = {
    // Firebase Configuration
    firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    },
    
    // API Keys
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
    groqApiKey: import.meta.env.VITE_GROQ_API_KEY
};

// Export for global usage
window.ENV = config;
