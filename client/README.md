# Harambee Hub - Frontend Client

A modern React TypeScript frontend for the Harambee Hub collaborative task management application.

## 🚀 Features

- **Modern React** with TypeScript and Vite
- **Responsive Design** with Tailwind CSS
- **Component Library** using shadcn/ui built on Radix UI
- **Form Management** with React Hook Form and Zod validation
- **State Management** with React Query for server state
- **Routing** with React Router DOM
- **Notifications** with Sonner toast library
- **Charts & Visualization** with Recharts
- **Professional UI/UX** with modern design patterns

## 📂 Project Structure

```
client/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── api/                 # API service functions
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components
│   │   └── common/         # Common components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries
│   ├── utils/              # Utility functions
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18.x or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the client directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Harambee Hub
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm start` - Start production preview server

## 🎨 UI Components

### shadcn/ui Components

The project uses shadcn/ui components built on Radix UI:

- **Forms**: Input, Button, Select, Checkbox, etc.
- **Layout**: Card, Dialog, Sheet, Tabs, etc.
- **Navigation**: Navigation Menu, Breadcrumb, etc.
- **Feedback**: Alert, Toast, Progress, etc.
- **Data Display**: Table, Avatar, Badge, etc.

### Custom Components

- **Layout Components**: Header, Sidebar, Footer
- **Form Components**: Custom form wrappers
- **Business Logic Components**: Task cards, Club cards, etc.

## 🔧 Development

### Code Structure

```typescript
// Example component structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ }) => {
  // Component logic
  return (
    // JSX
  );
};
```

### State Management

- **Server State**: React Query for API data
- **Client State**: React useState and useContext
- **Form State**: React Hook Form
- **URL State**: React Router

### API Integration

```typescript
// Example API service
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  // ... other endpoints
};
```

### Form Validation

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## 🎯 Key Features

### Authentication
- User registration and login
- JWT token management
- Protected routes
- Role-based access control

### Task Management
- Create, edit, delete tasks
- Task status tracking
- Priority levels
- Due date management
- Personal and club tasks

### Club Management
- Browse public clubs
- Create new clubs
- Join club requests
- Member management
- Club admin features

### Admin Dashboard
- User management
- Club approval workflow
- System statistics
- Pending requests management

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security

- JWT token storage and management
- Protected routes
- Input validation
- XSS protection
- CSRF protection

## 🚀 Production Build

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deployment

The built files will be in the `dist/` directory. Deploy to:

- **Vercel**: Connect GitHub repository
- **Netlify**: Drag and drop `dist/` folder
- **AWS S3**: Upload `dist/` contents
- **GitHub Pages**: Use GitHub Actions

### Environment Variables for Production

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=Harambee Hub
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
  <Button variant="outline" size="sm">Action</Button>
</div>
```

### Custom Styles

Global styles are in `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables */
  }
}
```

## 📊 Performance

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Dead code elimination
- **Bundle Analysis**: Use `npm run build` to analyze
- **Lazy Loading**: Components and routes
- **Image Optimization**: WebP format support

## 🧪 Testing

### Recommended Testing Setup

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use proper component structure
3. Add proper types and interfaces
4. Follow the existing code style
5. Test your changes

## 📄 License

This project is licensed under the MIT License.
