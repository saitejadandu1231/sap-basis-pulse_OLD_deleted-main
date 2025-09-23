# SAP Basis Pulse - Frontend

Enterprise support ticketing system frontend built with React, TypeScript, and Tailwind CSS.

## 🚀 Vercel Deployment

This project is configured for deployment on Vercel with the following features:

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router with proper SPA configuration
- **API Integration**: Axios with environment-based API URLs
- **Build Optimization**: Code splitting and chunk optimization

## 📦 Environment Variables

Required environment variables for deployment:

```bash
VITE_API_URL=https://your-backend-api.railway.app
```

## 🏗️ Build Configuration

- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **Node Version**: 18.x or higher

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # UI components
│   ├── pages/         # Route pages
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities and API
│   └── types/         # TypeScript types
├── public/            # Static assets
├── vercel.json        # Vercel configuration
└── vite.config.ts     # Vite configuration
```

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
