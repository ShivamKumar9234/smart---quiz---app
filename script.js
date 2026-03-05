// ADD YOUR API KEY HERE
const API_KEY = 'AIzaSyDuNG46U3xbPiqb8GSyxNwaD2Vds3F0Dsg'; 

let currentQuestionIndex = 0;
let score = 0;
let quizData = [];
let timerInterval;
let currentTopic = ""; 
let wrongAnswers = [];
let userSelections = [];

// Load past attempts on page load
document.addEventListener('DOMContentLoaded', displayHistory);

// Handle form submission
document.getElementById('quizConfigForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    currentTopic = document.getElementById('topic').value;
    const numQuestions = document.getElementById('numQuestions').value;
    const difficulty = document.getElementById('difficulty').value;
    const timeLimit = document.getElementById('timeLimit').value;

    // Update button state during API call
    const startBtn = document.getElementById('startBtn');
    startBtn.innerText = "Generating Quiz from AI... Please wait";
    startBtn.disabled = true;

    await fetchQuestions(currentTopic, numQuestions, difficulty);
    
    // Start quiz if data is successfully fetched
    if(quizData.length > 0) {
        startQuiz(timeLimit);
    }
});

// Fetch questions from Gemini API
async function fetchQuestions(topic, num, difficulty) {
    const prompt = `Generate ${num} multiple-choice questions on the topic "${topic}" at a ${difficulty} difficulty level. Return the output STRICTLY as a JSON array where each object has the following keys: "question", "options" (an array of 4 strings), "correctAnswer" (the correct option string), and "explanation" (a brief explanation of the answer). Do not include any markdown formatting like \`\`\`json.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const aiTextResponse = data.candidates[0].content.parts[0].text;
        
        quizData = JSON.parse(aiTextResponse); 
    } catch (error) {
        console.error("API Fetch Error:", error);
        alert("Failed to connect to the AI service. Please check the console for details.");
        // Reset button state on error
        document.getElementById('startBtn').innerText = "Generate & Start Quiz";
        document.getElementById('startBtn').disabled = false;
    }
}

// Initialize the quiz UI and timer
function startQuiz(timeLimit) {
    document.getElementById('quizConfigForm').style.display = "none";
    document.getElementById('historySection').style.display = "none"; 
    document.getElementById('quizSection').style.display = "block";
    document.querySelector('h1').innerText = "Quiz Time!";
    document.querySelector('p').innerText = "Good luck.";

    startTimer(timeLimit);
    showQuestion(); 
}

// Display the current question and options
function showQuestion() {
    document.getElementById('nextBtn').style.display = "none";
    document.getElementById('explanationBox').style.display = "none";
    document.getElementById('voiceStatus').innerText = "";
    
    const currentQ = quizData[currentQuestionIndex];
    document.getElementById('questionText').innerText = `Q${currentQuestionIndex + 1}: ${currentQ.question}`;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = ""; 

    // Generate option buttons
    currentQ.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.onclick = () => selectOption(button, option, currentQ.correctAnswer);
        optionsContainer.appendChild(button);
    });
}

// Handle option selection and validation
function selectOption(selectedButton, selectedAnswer, correctAnswer) {
    userSelections[currentQuestionIndex] = selectedAnswer;
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = "not-allowed";
        
        // Highlight correct answer
        if (btn.innerText === correctAnswer) {
            btn.style.backgroundColor = "#28a745"; 
            btn.style.color = "white";
        }
    });

    // Update score and highlight selected answer
    if (selectedAnswer === correctAnswer) {
        score++;
    } else {
        selectedButton.style.backgroundColor = "#dc3545"; 
        selectedButton.style.color = "white";
        wrongAnswers.push(quizData[currentQuestionIndex]);
    }

    document.getElementById('explanationText').innerText = quizData[currentQuestionIndex].explanation;
    document.getElementById('explanationBox').style.display = "block";
    document.getElementById('nextBtn').style.display = "block"; 
}

// Handle transition to next question or end of quiz
document.getElementById('nextBtn').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        showQuestion(); 
    } else {
        endQuiz(); 
    }
});

// Manage the quiz countdown timer
function startTimer(minutes) {
    let timeInSeconds = minutes * 60;
    const timerDisplay = document.getElementById('timerDisplay');
    
    timerInterval = setInterval(function() {
        let min = Math.floor(timeInSeconds / 60);
        let sec = timeInSeconds % 60;
        sec = sec < 10 ? "0" + sec : sec; 

        timerDisplay.innerText = `Time Left: ${min}:${sec}`; 

        if (timeInSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Time's Up! Submitting quiz...");
            endQuiz();
        }
        timeInSeconds--;
    }, 1000); 
}

// End quiz, save results, and display score
function endQuiz() {
    clearInterval(timerInterval);
    saveToHistory(); 

    // NAYA LOGIC: Agar galat answers hain toh Insights button dikhao
    let insightsHtml = "";
    if (wrongAnswers.length > 0) {
        insightsHtml = `
            <button id="insightsBtn" onclick="getStudyInsights()" style="margin-top: 15px; padding: 10px; background-color: #ffc107; color: #333; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Get AI Study Insights 🧠</button>
            <div id="insightsContent" style="margin-top: 15px; font-size: 15px; color: #444; text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; display: none;">Loading insights...</div>
        `;
    } else {
        insightsHtml = `<p style="color: #28a745; margin-top: 15px; font-weight: bold;">Perfect score! You are a master of this topic! 🌟</p>`;
    }

   document.getElementById('quizSection').innerHTML = `
        <h2>Quiz Completed!</h2>
        <p style="font-size: 20px;">Your Score: <strong>${score} / ${quizData.length}</strong></p>
        
        <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 8px;">
            <p style="margin-bottom: 10px; font-weight: bold;">Export Quiz to PDF 📄</p>
            <button onclick="downloadPDF('unanswered')" style="padding: 8px 12px; margin-right: 10px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Download Unanswered</button>
            <button onclick="downloadPDF('answered')" style="padding: 8px 12px; background-color: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">Download Answered</button>
        </div>

        ${insightsHtml}
        <br>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;">Take Another Quiz</button>
    `;
}

async function getStudyInsights() {
    const btn = document.getElementById('insightsBtn');
    const content = document.getElementById('insightsContent');
    
    btn.disabled = true;
    btn.innerText = "Analyzing your performance...";
    content.style.display = "block";

    // Galat questions ki list tayar karna
    let wrongQText = wrongAnswers.map(q => q.question).join(" | ");

    // AI ko naya prompt bhejna
    const prompt = `The user took a quiz on the topic "${currentTopic}". They got these specific questions wrong: ${wrongQText}. Based on these wrong answers, analyze their weak areas and suggest 3 specific sub-topics they should study more. Keep the response encouraging, concise, and format it strictly as a simple HTML list (<ul><li>...</li></ul>) without any markdown code blocks.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const aiInsights = data.candidates[0].content.parts[0].text;
        
        content.innerHTML = `<strong>Areas to Improve:</strong><br>${aiInsights}`;
        btn.style.display = "none"; // Button gayab kar do
    } catch (error) {
        console.error("Insights Error:", error);
        content.innerHTML = "<span style='color:red;'>Failed to load insights. Please try again.</span>";
        btn.disabled = false;
        btn.innerText = "Get AI Study Insights 🧠";
    }
}

// PDF Download karne ka function
function downloadPDF(type) {
    const printContent = document.createElement('div');
    printContent.style.padding = '20px';
    printContent.style.fontFamily = 'Arial, sans-serif';
    printContent.style.backgroundColor = '#ffffff'; // Ensure white background

    // PDF ke andar har cheez par !important lagaya hai taaki Dark Mode ka asar na pade
    let html = `<div style="color: #000000 !important;">`;
    html += `<h1 style="text-align: center; color: #000000 !important;">${currentTopic} - AI Quiz</h1>`;
    html += `<p style="text-align: center; color: #555555 !important;">Generated via Smart Quiz App</p><hr style="margin-bottom: 20px; border-color: #cccccc;">`;

    quizData.forEach((q, index) => {
        html += `<div style="margin-bottom: 25px; page-break-inside: avoid;">`;
        html += `<h3 style="margin-bottom: 10px; font-size: 16px; color: #000000 !important;">Q${index + 1}: ${q.question}</h3>`;

        if (type === 'unanswered') {
            q.options.forEach(opt => {
                html += `<p style="margin: 5px 0; font-size: 14px; color: #333333 !important;">◯ ${opt}</p>`;
            });
        } else if (type === 'answered') {
            const userAns = userSelections[index] || "Not answered (Time Out)";
            
            q.options.forEach(opt => {
                let style = "color: #555555 !important;";
                let icon = "◯";
                
                if (opt === q.correctAnswer) {
                    style = "color: #28a745 !important; font-weight: bold;";
                    icon = "✅";
                } else if (opt === userAns && userAns !== q.correctAnswer) {
                    style = "color: #dc3545 !important; text-decoration: line-through;";
                    icon = "❌";
                }
                html += `<p style="margin: 5px 0; font-size: 14px; ${style}">${icon} ${opt}</p>`;
            });

            html += `<div style="margin-top: 10px; padding: 10px; background-color: #f4f7f6 !important; border-left: 3px solid #007BFF !important; font-size: 13px;">`;
            html += `<strong style="color: #000000 !important;">Your Choice:</strong> <span style="color: #333333 !important;">${userAns}</span> <br>`;
            html += `<strong style="color: #007BFF !important;">Explanation:</strong> <span style="color: #333333 !important;">${q.explanation}</span>`;
            html += `</div>`;
        }
        html += `</div>`;
    });
    
    html += `</div>`; // Wrapper close
    printContent.innerHTML = html;

    // PDF ki settings
    const opt = {
        margin:       10,
        filename:     `${currentTopic.replace(/\s+/g, '_')}_Quiz_${type}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    alert(`Generating your ${type} PDF... Please wait a few seconds.`);
    html2pdf().set(opt).from(printContent).save();
}

// ==========================================
// VOICE-TO-ANSWER LOGIC (WEB SPEECH API)
// ==========================================

// Browser ki speech recognition API setup karna
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

function startVoiceRecognition() {
    if (!recognition) {
        alert("Your browser does not support Voice Recognition. Please use Google Chrome.");
        return;
    }

    const voiceStatus = document.getElementById('voiceStatus');
    const micBtn = document.getElementById('micBtn');

    // Mic start hone par
    recognition.onstart = function() {
        micBtn.style.backgroundColor = "#dc3545"; // Laal rang (recording)
        micBtn.innerText = "🛑 Listening...";
        voiceStatus.innerText = "Speak your answer clearly...";
        voiceStatus.style.color = "#007BFF";
    };

    // User ke bolne ke baad
    recognition.onspeechend = function() {
        recognition.stop();
        micBtn.style.backgroundColor = "#ff5722"; // Wapas orange rang
        micBtn.innerText = "🎤 Answer by Voice";
    };

    // Jab aawaz text mein convert ho jaye
    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript.toLowerCase().trim();
        
        // Find matching option
        const currentQ = quizData[currentQuestionIndex];
        const options = currentQ.options;
        let matchedOption = null;
        let matchedButton = null;

        const buttons = document.querySelectorAll('.option-btn');

        // Check karna ki jo user ne bola, kya wo kisi option se match karta hai
        for (let i = 0; i < options.length; i++) {
            const optionText = options[i].toLowerCase();
            // Agar boli hui aawaz option mein hai, ya option boli hui aawaz mein hai
            if (optionText.includes(spokenText) || spokenText.includes(optionText)) {
                matchedOption = options[i];
                matchedButton = buttons[i];
                break;
            }
        }

        if (matchedOption) {
            voiceStatus.innerText = `You said: "${spokenText}" - Match found! ✅`;
            voiceStatus.style.color = "#28a745";
            
            // Agar button pehle se press nahi hua hai, toh usko automatically click kardo
            if(!matchedButton.disabled) {
                 selectOption(matchedButton, matchedOption, currentQ.correctAnswer);
            }
        } else {
            voiceStatus.innerText = `You said: "${spokenText}" - No match found. Try again or click manually. ❌`;
            voiceStatus.style.color = "#dc3545";
        }
    };

    // Agar koi error aaye (jaise mic permission allow na karna)
    recognition.onerror = function(event) {
        voiceStatus.innerText = "Error: " + event.error + " (Make sure microphone is allowed)";
        voiceStatus.style.color = "#dc3545";
        micBtn.style.backgroundColor = "#ff5722";
        micBtn.innerText = "🎤 Answer by Voice";
    };

    // Start listening!
    recognition.start();
}

// Save current quiz result to Local Storage
function saveToHistory() {
    const result = {
        topic: currentTopic,
        score: score,
        total: quizData.length,
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };

    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    history.push(result);
    localStorage.setItem('quizHistory', JSON.stringify(history));
}

// Retrieve and display past attempts from Local Storage
function displayHistory() {
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    const historyList = document.getElementById('historyList');
    
    if (historyList) {
        historyList.innerHTML = "";
        if (history.length === 0) {
            historyList.innerHTML = "<li style='color: #888;'>No past attempts yet.</li>";
        } else {
            history.reverse().forEach(item => {
                let li = document.createElement('li');
                li.style.background = "#f8f9fa";
                li.style.margin = "5px 0";
                li.style.padding = "10px";
                li.style.border = "1px solid #ddd";
                li.style.borderRadius = "5px";
                li.innerHTML = `<strong>${item.topic}</strong> - Score: ${item.score}/${item.total} <br> <span style='font-size: 11px; color: #666;'>${item.date}</span>`;
                historyList.appendChild(li);
            });
        }
    }

}


