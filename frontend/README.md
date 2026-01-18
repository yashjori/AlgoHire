# AlgoHire Frontend

A beautiful, award-winning frontend for the AlgoHire coding platform built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 **Modern UI/UX** - Beautiful glassmorphism design with smooth animations
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and builds
- 🎭 **Smooth Animations** - Powered by Framer Motion for fluid transitions
- 💻 **Code Editor** - Monaco Editor integration for an excellent coding experience
- 🔐 **Authentication** - JWT-based authentication with secure token management
- 📱 **Responsive Design** - Works beautifully on all devices
- 🌈 **Dark Theme** - Eye-friendly dark theme with gradient accents

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library
- **Monaco Editor** - VS Code editor in the browser
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to `/api`):
```env
VITE_API_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── store/          # State management
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
└── package.json        # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication
- Login and registration pages with beautiful animations
- JWT token management with automatic refresh
- Role-based access (CANDIDATE/RECRUITER)

### Dashboard
- Problem listing with difficulty badges
- Statistics cards showing problem counts
- Filterable and searchable problem grid

### Problem Detail
- Monaco code editor with syntax highlighting
- Real-time code execution
- Test case preview
- Leaderboard integration

### Leaderboard
- Ranked list of top performers
- Visual indicators for top 3 positions
- Execution time tracking

### Submissions
- View all your submissions
- Detailed verdict information
- Code snippet preview

### Create Problem (Recruiters)
- Problem creation interface
- Multiple test case management
- Difficulty and constraints configuration

## API Integration

The frontend integrates with the Spring Boot backend through REST APIs. All API calls are handled in `src/services/api.ts` with automatic JWT token injection.

## Styling

The application uses Tailwind CSS with custom configurations:
- Glassmorphism effects (`.glass` class)
- Gradient text (`.text-gradient` class)
- Custom animations and transitions
- Dark theme with purple/blue gradient accents

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is part of the AlgoHire platform.

