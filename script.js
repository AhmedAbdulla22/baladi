// Global State Variables
let config;
let isAppReady = false;
let db; // To hold the Firebase firestore instance

// 1. Define functions globally immediately so HTML buttons can find them
window.showSection = function showSection(sectionId) {
    if (!isAppReady) {
        alert('جاري تحميل التطبيق... يرجى الانتظار');
        return;
    }
    // Hide all sections and show the targeted one
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId + '-section').classList.remove('hidden');
};

window.askAI = async function askAI() {
    if (!isAppReady) {
        alert('جاري تحميل التطبيق... يرجى الانتظار');
        return;
    }
    
    const inputField = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const userText = inputField.value.trim();
    const GEMINI_API_KEY = config.geminiApiKey; 

    if (!userText) return;

    chatWindow.innerHTML += `<div class="message user-msg">${userText}</div>`;
    inputField.value = "";
    
    const loadingId = "load-" + Date.now();
    chatWindow.innerHTML += `<div class="message bot-msg typing" id="${loadingId}">جاري التفكير...</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    const promptInstructions = `أنت مساعد ذكي لبلدية كركوك. أجب باللهجة العراقية وباحترافية اذا سأل بالعربي و اذا سأل بالكردي اجب باللهجة السوراني و اذا انجليزي أجب بالانجليزي. السؤال هو: ${userText}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptInstructions }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("خطأ من السيرفر:", data.error.message);
            throw new Error(data.error.message);
        }

        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (data.candidates && data.candidates[0].content) {
            const aiReply = data.candidates[0].content.parts[0].text;
            chatWindow.innerHTML += `<div class="message bot-msg">${aiReply}</div>`;
        } else {
            chatWindow.innerHTML += `<div class="message bot-msg">عذراً، لم أستطع معالجة الرد حالياً. حاول صياغة السؤال بشكل آخر.</div>`;
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerText = "خطأ: " + error.message;
            loadingElement.classList.remove('typing');
        }
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
};

window.submitToFirebase = async function submitToFirebase() {
    if (!isAppReady || !db) {
        alert('جاري تحميل التطبيق... يرجى الانتظار');
        return;
    }

    const name = document.getElementById('fullName').value;
    const type = document.getElementById('requestType').value;
    const desc = document.getElementById('description').value;

    if (!name || !desc) {
        alert("⚠️ يرجى ملء كافة البيانات الأساسية.");
        return;
    }

    const transactionID = 'MUN-' + Math.floor(1000 + Math.random() * 9000);

    try {
        await db.collection("requests").doc(transactionID).set({
            name: name,
            type: type,
            description: desc,
            status: "قيد المراجعة الفنية",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`✅ تم إرسال طلبك بنجاح!\nرقم التتبع السحابي: ${transactionID}`);
        document.getElementById('mainForm').reset();
        window.showSection('tracking');
    } catch (error) {
        alert("خطأ في الاتصال بالسحابة: " + error.message);
    }
};

window.trackFromFirebase = async function trackFromFirebase() {
    if (!isAppReady || !db) {
        alert('جاري تحميل التطبيق... يرجى الانتظار');
        return;
    }

    const searchID = document.getElementById('searchID').value.trim().toUpperCase();
    const display = document.getElementById('search-result');
    
    if (!searchID) return;

    display.innerHTML = "جاري البحث في قاعدة البيانات السحابية...";

    try {
        const doc = await db.collection("requests").doc(searchID).get();
        if (doc.exists) {
            const data = doc.data();
            display.innerHTML = `
                <div style="border: 2px solid #27ae60; padding: 20px; border-radius: 10px; background: #f9fff9;">
                    <p><strong>صاحب المعاملة:</strong> ${data.name}</p>
                    <p><strong>نوع الخدمة:</strong> ${data.type}</p>
                    <p><strong>الحالة الحالية:</strong> <span class="status-badge" style="background:#f39c12; color:white; padding:5px 10px; border-radius:15px;">${data.status}</span></p>
                </div>`;
        } else {
            display.innerHTML = `<p style="color:#e74c3c;">❌ رقم المعاملة غير موجود في السحابة.</p>`;
        }
    } catch (error) {
        display.innerHTML = "خطأ في الجلب: " + error.message;
    }
};

// 2. Helper functions
async function checkAvailableModels() {
    const GEMINI_API_KEY = config.geminiApiKey; 
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();
        
        console.log("النماذج المتاحة لك حالياً هي:");
        const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        textModels.forEach(model => {
            console.log(`اسم النموذج: ${model.name.replace('models/', '')}`);
        });
        
    } catch (error) {
        console.error("خطأ في جلب النماذج:", error);
    }
}

// 3. Initialization Logic
function initializeApp() {
    if (!config) {
        console.error('Configuration not loaded. Please check your environment variables.');
        return;
    }

    // Initialize Firebase
    const firebaseConfig = config.firebase;
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();

    // Check Gemini Models
    checkAvailableModels();
    
    // Mark app as ready to unlock the UI
    isAppReady = true;
    console.log('Application initialized successfully');
}

// 4. Config Watcher (Wait for window.ENV to be populated)
function waitForConfig() {
    if (window.ENV) {
        config = window.ENV;
        initializeApp();
    } else {
        console.warn('Configuration not yet loaded, retrying...');
        setTimeout(waitForConfig, 100);
    }
}

// Start the application
waitForConfig();