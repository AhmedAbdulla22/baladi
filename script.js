// Load configuration from environment variables
const config = window.ENV;

if (!config) {
    console.error('Configuration not loaded. Please check your environment variables.');
    throw new Error('Environment configuration missing');
}

// 1. إعدادات Firebase
const firebaseConfig = config.firebase;

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

async function checkAvailableModels() {
    const GEMINI_API_KEY = config.geminiApiKey; 

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();
        
        console.log("النماذج المتاحة لك حالياً هي:");
        // فلترة النماذج التي تدعم generateContent لتسهيل القراءة
        const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        textModels.forEach(model => {
            console.log(`اسم النموذج: ${model.name.replace('models/', '')}`);
        });
        
    } catch (error) {
        console.error("خطأ في جلب النماذج:", error);
    }
}

// استدعاء الدالة للفحص
checkAvailableModels();

// -------------------------------------------------------
// 2. ربط الذكاء الاصطناعي (Google Gemini AI)
// -------------------------------------------------------
async function askAI() {
    const inputField = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const userText = inputField.value.trim();
    
    // ⚠️ مفتاح Gemini يتم جلبه من ملف الإعدادات
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
}

// -------------------------------------------------------
// 3. قاعدة البيانات السحابية (Firebase)
// -------------------------------------------------------
async function submitToFirebase() {
    const name = document.getElementById('fullName').value;
    const type = document.getElementById('requestType').value;
    const desc = document.getElementById('description').value;

    // Validation (المهمة الثالثة من البروفيسور)
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
        showSection('tracking');
    } catch (error) {
        alert("خطأ في الاتصال بالسحابة: " + error.message);
    }
}

async function trackFromFirebase() {
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
}

// 4. نظام التنقل
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId + '-section').classList.remove('hidden');
}

// ربط الدوال بالـ window لتعمل مع HTML
window.askAI = askAI;
window.submitToFirebase = submitToFirebase;
window.trackFromFirebase = trackFromFirebase;
window.showSection = showSection;