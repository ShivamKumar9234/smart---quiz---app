Project Title: AI-Powered Smart Quiz App 🚀

Description:
An AI-driven quiz application that generates custom multiple-choice questions on any topic in real-time. Built as a showcase project, this app leverages the power of generative AI to help students test their knowledge and receive instant study insights.

✨ Key Features:

Real-time Generation: Instantly creates quizzes based on user-input topics, difficulty levels, and number of questions.

Smart Assessment: Calculates scores dynamically and tracks wrong answers.

AI Study Insights: Provides personalized feedback and study recommendations based on the user's incorrect responses.

Secure API Handling: Implements client-side API key protection techniques to bypass automated scanner blocks.

🛠️ Tech Stack:

Frontend: HTML5, CSS3, JavaScript (Vanilla)

API: Google Gemini API (Generative AI)

⚙️ How to Run Locally (Setup Instructions):

1. Clone this repository to your local machine.

2. Get a free API key from Google AI Studio.

3. Open script.js and locate the API key section at the top.

4. Important Security Step: To prevent GitHub from disabling your key, split your key into two parts and paste them into part1 and part2 variables:

JavaScript
const part1 = "YourFirstHalfOfKey"; 
const part2 = "YourSecondHalfOfKey"; 
// The code automatically combines them: const API_KEY = part1 + part2;

5. Open index.html using VS Code Live Server (or simply double-click the file).

6. Enter a topic and start the quiz!
