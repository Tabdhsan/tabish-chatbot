# React + Vite + ShadCN Starter

A modern, production-ready starter template for React applications using Vite and ShadCN UI components.

## Features

- ⚡️ **Vite** - Fast build tool and development server
- ⚛️ **React 19** - Latest React with modern features
- 🎨 **ShadCN UI** - Beautiful, accessible UI components
- 🌈 **Tailwind CSS** - Utility-first CSS framework
- 📝 **TypeScript** - Type safety and better developer experience
- 🔧 **ESLint** - Code linting and formatting
- 📱 **Responsive** - Mobile-first responsive design

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone this repository:
```bash
git clone the repository url
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   │   └── ui/      # ShadCN UI components
│   ├── lib/         # Utility functions
│   ├── App.tsx      # Main app component
│   ├── main.tsx     # Entry point
│   └── index.css    # Global styles
├── components.json   # ShadCN configuration
├── vite.config.ts   # Vite configuration
└── tsconfig.json    # TypeScript configuration
```

## Adding ShadCN Components

To add new ShadCN components:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

## Deployment


The application will be available at [http://localhost:3000](http://localhost:3000).

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Serve the `dist` folder with your preferred static file server.

## Customization

### Theme

The project uses a custom color scheme defined in `src/index.css`. You can modify the CSS variables to match your brand colors.

### ShadCN Configuration

ShadCN is configured in `components.json`. You can modify:
- Style variant (default, new-york)
- Base color
- CSS variables
- Component aliases

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.