# Yuktor - Frontend

Enterprise support ticketing system frontend built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Responsive Design**: Mobile-first approach with touch-friendly UI
- **Real-time Updates**: Live ticket status and messaging updates
- **Role-based Interface**: Tailored experiences for Admin, Consultant, and Customer roles
- **Progressive Web App**: Offline-capable with service worker support

### User Experience
- **Modern UI**: Clean, accessible interface with shadcn/ui components
- **Performance Optimized**: Lazy loading, code splitting, and efficient caching
- **Accessibility**: WCAG compliant with proper focus management
- **Cross-platform**: Works seamlessly on desktop, tablet, and mobile

### Technical Features
- **Type Safety**: Full TypeScript implementation
- **State Management**: React Query for server state, Context for UI state
- **Routing**: Protected routes with role-based access control
- **Error Handling**: Comprehensive error boundaries and user feedback

## 🚀 Vercel Deployment

This project is configured for deployment on Vercel with the following optimizations:

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui with responsive design
- **Routing**: React Router with proper SPA configuration
- **API Integration**: Axios with environment-based API URLs
- **Build Optimization**: Code splitting, lazy loading, and chunk optimization
- **Performance**: React Query caching and optimized bundle size

## 📦 Environment Variables

Required environment variables for deployment:

```bash
VITE_API_URL=https://sap-basis-pulseolddeleted-main-production.up.railway.app/api/
```

## 🏗️ Build Configuration

- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Node Version**: 18.x or higher

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── navigation/     # Navigation and routing components
│   │   └── layout/         # Layout and page structure
│   ├── pages/              # Route-based page components
│   │   ├── admin/          # Admin-specific pages
│   │   └── auth/           # Authentication pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service functions
│   ├── contexts/           # React context providers
│   ├── lib/                # Utilities and configurations
│   └── integrations/       # Third-party service integrations
├── public/                 # Static assets and PWA files
├── vercel.json             # Vercel deployment configuration
└── vite.config.ts          # Vite build configuration
```

## 🎨 Design System

### Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md/lg)
- **Desktop**: > 1024px (xl/2xl)

### Key Components
- **PageLayout**: Responsive layout with sidebar navigation
- **RoleBasedNav**: Dynamic navigation based on user roles
- **DashboardOverview**: Comprehensive dashboard with metrics
- **ConsultantAvailability**: Mobile-optimized availability management

### Accessibility Features
- Focus management and keyboard navigation
- Screen reader support with proper ARIA labels
- High contrast support with light/dark themes
- Touch-friendly interactive elements (44px minimum)

## 🚀 Deployment Steps

1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy automatically on push

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1482da48-c05b-4a1e-a6a3-b1a5b87480f1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
