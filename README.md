# DevDeck

A modern Twitter-like feed application built with React, TypeScript, and Tailwind CSS. DevDeck provides a real-time social media experience with diverse content from tech companies, news organizations, and global institutions.

## Features

- **Dark Theme**: Modern dark UI with subtle grid background pattern
- **Responsive Design**: Mobile-first design with collapsible sidebar
- **Feed Management**: Real-time feed with search, deploy, translate, and view actions
- **Token Management**: Interactive token cards with buy amount controls and percentage buttons
- **State Management**: Zustand for efficient state management
- **Animations**: Smooth animations with Framer Motion
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **Framer Motion** for animations
- **Lucide React** for icons
- **Vite** for build tooling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xdeploy-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx       # Top navigation bar
│   ├── Feed.tsx         # Main feed container
│   ├── FeedCard.tsx     # Individual feed post card
│   ├── Sidebar.tsx      # Right sidebar with tokens
│   ├── TokenCard.tsx    # Individual token card
│   └── SearchBar.tsx    # Feed search input
├── pages/               # Page components
│   └── Dashboard.tsx    # Main dashboard page
├── store/               # Zustand stores
│   ├── feedStore.ts     # Feed state management
│   └── tokenStore.ts    # Token state management
├── data/                # Mock data
│   └── mockData.ts      # Sample feed posts and tokens
├── lib/                 # Utility functions
│   └── utils.ts         # Helper functions
└── App.tsx              # Root component
```

## Features Overview

### Feed Management
- Search through posts with real-time filtering
- Deploy posts with mock functionality
- Translate posts (simulated)
- View external links
- Dismiss posts from feed
- Support for retweets and quote tweets

### Token Management
- View token information (name, ticker, address)
- Edit buy amounts with numeric input
- Quick percentage buttons (25%, 50%, 75%, 100%)
- Remove tokens from list
- Available balance tracking

### Responsive Design
- Desktop: Sidebar always visible
- Tablet: Sidebar collapses to drawer
- Mobile: Floating action button to open sidebar

## Customization

### Styling
The application uses Tailwind CSS v4 with a custom dark theme. Key colors:
- Background: `#121212` (gray-950)
- Cards: `#1f2937` (gray-900)
- Borders: `#374151` (gray-800)
- Text: `#ffffff` (white) / `#9ca3af` (gray-400)

### State Management
The application uses Zustand for state management. You can extend the stores in `src/store/` to add new features.

### Mock Data
Sample data is provided in `src/data/mockData.ts`. Replace with real API calls for production use.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
# Tweet.dev
