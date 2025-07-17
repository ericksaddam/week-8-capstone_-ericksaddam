# Harambee Hub - Backend Server

A robust Node.js/Express backend server for the Harambee Hub collaborative task management application.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB** database with Mongoose ODM
- **JWT Authentication** with role-based access control
- **Professional Architecture** with controllers, models, routes, and middleware
- **Input Validation** and error handling
- **CORS** enabled for cross-origin requests
- **Environment Configuration** for different deployment stages

## 📂 Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── taskController.js    # Task management logic
│   ├── clubController.js    # Club management logic
│   └── adminController.js   # Admin dashboard logic
├── middleware/
│   └── auth.js              # JWT authentication & authorization
├── models/
│   ├── User.js              # User schema and model
│   ├── Task.js              # Task schema and model
│   └── Club.js              # Club schema and model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── tasks.js             # Task management routes
│   ├── clubs.js             # Club management routes
│   └── admin.js             # Admin routes
├── utils/                   # Utility functions
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variables template
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18.x or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
MONGO_URI=mongodb://localhost:27017/harambee
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Database Setup

Ensure MongoDB is running:

- **Local MongoDB**: Start your local MongoDB service
- **MongoDB Atlas**: Use your Atlas connection string in `MONGO_URI`

### 4. Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/club/:clubId` - Get club tasks

### Clubs
- `GET /api/clubs/public` - Get public clubs
- `GET /api/clubs/user` - Get user's clubs
- `POST /api/clubs` - Create new club
- `GET /api/clubs/:id` - Get club details
- `PUT /api/clubs/:id` - Update club
- `POST /api/clubs/:id/join` - Request to join club
- `GET /api/clubs/:id/members` - Get club members

### Admin (Admin Only)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/clubs` - Get all clubs
- `POST /api/admin/clubs/:id/approval` - Approve/reject clubs
- `GET /api/admin/requests` - Get pending requests

## 🔒 Authentication & Authorization

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to receive a JWT token
2. **Include token** in Authorization header: `Bearer <token>`
3. **Role-based access** for admin endpoints

### User Roles
- `user` - Regular user with basic permissions
- `admin` - Administrator with full system access

## 🗄️ Database Models

### User Model
- Personal information and preferences
- Authentication credentials
- Role-based permissions
- Club memberships and tasks

### Task Model
- Personal and club tasks
- Status tracking and priorities
- Assignment and due dates
- Creator and assignee relationships

### Club Model
- Club information and settings
- Member management with roles
- Join requests and approval workflow
- Communities, knowledge base, and goals

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/harambee` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set appropriate `CLIENT_URL`
5. Enable HTTPS in production
6. Configure proper CORS settings
7. Set up monitoring and logging

### Deployment Platforms

- **Heroku**: Use Heroku MongoDB add-on or MongoDB Atlas
- **Railway**: Connect to MongoDB Atlas
- **DigitalOcean**: Use managed MongoDB or self-hosted
- **AWS**: Use DocumentDB or MongoDB Atlas

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)
- Environment variable protection

## 📝 API Documentation

For detailed API documentation, consider using:
- Swagger/OpenAPI
- Postman Collections
- API Blueprint

## 🤝 Contributing

1. Follow the existing code structure
2. Use proper error handling
3. Add input validation
4. Write meaningful commit messages
5. Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License.
