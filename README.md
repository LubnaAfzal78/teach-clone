# 🎓 Teach Clone

**Teach Clone** is an AI-powered education platform where teachers upload video lectures, and AI creates a "clone" of their teaching persona. Students can then interact with these AI clones 24/7 to ask questions and learn.

Built for the **AI Hackathon**, this project demonstrates the power of **Google Gemini API** in education.

## 🚀 Features

*   **Role-Based Access**: Dedicated portals for Teachers, Students, and Admins.
*   **Video Analysis**: Uploaded videos are analyzed by Gemini 1.5 Flash to extract teaching style, tone, and common phrases.
*   **AI Personality Generation**: Creates a custom system prompt based on the teacher's unique style.
*   **Interactive Chat**: Students chat with the AI clone in a WhatsApp-style interface.
*   **Admin Dashboard**: Manage user approvals and review AI personalities before they go live.
*   **Responsive Design**: Fully optimized for mobile and desktop.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Routing**: React Router DOM
*   **AI Integration**: Google Gemini API (`@google/genai` SDK)
*   **Icons**: Lucide React
*   **Storage**: LocalStorage (Simulated Backend/Database for Demo)

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/teach-clone.git
    cd teach-clone
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure API Key**:
    *   Create a file named `.env` in the root directory.
    *   Add your Google Gemini API key:
        ```env
        API_KEY=your_google_gemini_api_key_here
        ```
    *   *Note: For the demo environment, the key is injected via process.env.*

4.  **Run the development server**:
    ```bash
    npm start
    ```

## 🔑 Login Credentials (Demo)

**Admin**:
*   Email: `admin@teachclone.com`
*   Password: `password`

**Teacher/Student**:
*   Register a new account from the landing page.
*   Teachers require Admin approval (use Admin account to approve).
*   Students are auto-approved.

## 📱 Mobile Responsiveness

The application is fully responsive. 
*   **Chat Interface**: Optimized for mobile height (`100dvh`).
*   **Navigation**: Collapsible sidebars with hamburger menus.
*   **Grids**: Adaptive card layouts.

## ⚠️ Important Notes

*   **Data Persistence**: This demo uses `LocalStorage` to simulate a database. Clearing your browser cache will reset all data.
*   **Video Analysis**: In the demo environment, video analysis is simulated with mock data if the API limit is reached or file processing is restricted.

## 📄 License

MIT License. Created for educational purposes.