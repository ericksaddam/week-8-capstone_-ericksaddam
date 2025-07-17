# Harambee Hub

A world-class collaborative task management application designed to empower communities and teams. Built with professional MERN stack architecture, this platform provides a robust, scalable solution for organizing tasks, managing clubs, and fostering collaboration.

## 🚀 Live Demo

- **Frontend**: [Live Application](https://your-frontend-url.com)
- **API Documentation**: [API Docs](https://your-api-url.com/docs)

## ✨ Key Features

### 🔐 Secure Authentication
- JWT-based authentication with role-based access control
- User registration and login with secure password hashing
- Protected routes and middleware authorization

### 📋 Advanced Task Management
- Create, update, and track personal tasks
- Club-based task assignment with member visibility
- Priority levels, due dates, and status tracking
- Real-time task updates and notifications

### 🏢 Dynamic Club Management
- **Club Discovery**: Public page to discover and join clubs
- **Admin Approval Workflow**: Secure club creation and join requests
- **Role-Based Permissions**: Owner, admin, and member roles
- **Community Features**: Chat, polls, knowledge base, and goals

### 👨‍💼 Powerful Admin Dashboard
- User management with block/unblock functionality
- Club oversight and approval system
- System statistics and analytics
- Pending requests management

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Architecture**: MVC pattern with controllers, models, routes

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **Notifications**: Sonner toast library

## 📁 Project Structure

```
harambee-hub/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── api/            # API service functions
│   │   ├── contexts/       # React contexts
│   │   └── lib/            # Utility libraries
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── README.md           # Frontend documentation
├── server/                 # Node.js Express backend
│   ├── controllers/        # Business logic controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18.x or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/harambee-hub.git
cd harambee-hub
```

### 2. Backend Setup

```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../client
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔧 Environment Configuration

### Server (.env)

```env
MONGO_URI=mongodb://localhost:27017/harambee
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Harambee Hub
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Task Management
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Club Management
- `GET /api/clubs/public` - Get public clubs
- `POST /api/clubs` - Create new club
- `POST /api/clubs/:id/join` - Request to join club

### Admin Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/clubs/:id/approval` - Approve/reject clubs

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test
```

### Frontend Testing

```bash
cd client
npm test
```

## 🚀 Deployment

### Backend Deployment

**Recommended Platforms:**
- Railway
- Heroku
- DigitalOcean
- AWS

**Database:**
- MongoDB Atlas (recommended)
- Self-hosted MongoDB

### Frontend Deployment

**Recommended Platforms:**
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd ../server
NODE_ENV=production npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use proper error handling
- Add input validation
- Write meaningful commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [Your Name](https://github.com/your-username)
- **Project**: PLP MERN Stack Development - Week 8 Capstone

## 🙏 Acknowledgments

- PLP Academy for the comprehensive MERN stack curriculum
- shadcn/ui for the beautiful component library
- The open-source community for amazing tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue in the GitHub repository.

---

**Built with ❤️ using the MERN Stack**