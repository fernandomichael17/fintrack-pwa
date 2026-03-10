# Fintrack PWA

Fintrack is a lightweight, high-performance personal finance tracker designed as a Progressive Web App (PWA). It features a strict monochrome minimalist design and provides comprehensive tools to manage accounts, transactions, and categories with both online (Supabase) and offline (Dexie) capabilities.

## 🚀 Key Features

- **Dashboard**: Overview of your financial status with balance, income, and expense summaries.
- **Account Management**: Track multiple financial accounts in one place.
- **Transaction Tracking**: Detailed history and management of all financial activities.
- **Category Management**: Organize your spending and income with customizable categories.
- **Profile Management**: Personalize your experience and manage authentication.
- **PWA Capabilities**: Installable on mobile and desktop, with offline support for viewing data.
- **Real-time Sync**: Powered by Supabase for seamless data synchronization across devices.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript & CSS for maximum performance.
- **Build Tool**: [Vite](https://vitejs.dev/) for a fast and modern development experience.
- **Backend/Auth**: [Supabase](https://supabase.com/) for authentication and real-time database.
- **Local Database**: [Dexie.js](https://dexie.org/) for robust offline data storage and caching.
- **PWA**: `vite-plugin-pwa` for service worker management and manifest generation.

## 📥 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/fernandomichael17/fintrack-pwa.git
    cd fintrack-pwa
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run locally**:
    ```bash
    npm run dev
    ```

5.  **Build for production**:
    ```bash
    npm run build
    ```

## 📂 Project Structure

```text
├── src/
│   ├── components/  # Reusable UI components (Toasts, etc.)
│   ├── config/      # Configuration files (Supabase, etc.)
│   ├── db/          # Dexie local database schema and logic
│   ├── pages/       # Application views (Dashboard, Login, etc.)
│   ├── services/    # API and business logic service layers
│   ├── styles/      # Vanilla CSS modules for styling
│   ├── app.js       # Main application logic
│   ├── main.js      # Entry point
│   └── router.js    # Routing logic
├── index.html       # Main HTML entry
├── vite.config.js   # Vite and PWA configuration
└── package.json     # Project dependencies and scripts
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
