# CAPTAIN-FUNDS MERN Stack Application

A comprehensive fundraising platform built with MongoDB, Express.js, React, and Node.js.

## Netlify live demo

The React client deploys to Netlify as a **demo-mode SPA** (no Mongo/Express on Netlify).

| Setting | Value |
|---------|--------|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `client/dist` |
| Framework | None / Vite (not Next.js) |

Set `VITE_DEMO_MODE=true` (default in `netlify.toml`). Clear build cache after first deploy.

**Demo logins:** `demo@captainfunds.app` / `demo123` · `admin@captainfunds.app` / `admin123`

Full MERN stack still runs locally with `server/` + MongoDB when `VITE_DEMO_MODE=false`.

## 🚀 Project Overview

CAPTAIN-FUNDS is a full-stack fundraising application that allows users to create campaigns, make donations, and track fundraising progress. The platform includes role-based access control, user management, and comprehensive reporting features.

## 📁 Project Structure

```
CAPTAIN-FUNDS-MERN/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── campaigns/  # Campaign management
│   │   │   ├── donations/  # Donation tracking
│   │   │   ├── profile/    # User profile
│   │   │   ├── reports/    # Analytics & reports
│   │   │   ├── settings/   # User settings
│   │   │   └── users/      # Admin user management
│   │   ├── layout/         # Layout components
│   │   ├── store/          # Zustand state management
│   │   ├── interfaces/     # TypeScript interfaces
│   │   └── providers/      # Context providers
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── package.json
├── docs/                  # Documentation
└── README.md
```

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Ant Design** for UI components
- **Zustand** for state management
- **React Router DOM** for routing
- **Axios** for HTTP requests
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **dotenv** for environment variables

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Environment Variables

Create a `.env` file in the `server` directory:

```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CAPTAIN-FUNDS-MERN
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the development servers**

   Terminal 1 (Server):
   ```bash
   cd server
   npm start
   ```

   Terminal 2 (Client):
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔐 Authentication & Authorization

### User Roles
- **Standard User**: Basic access to profile, donations, and reports
- **Admin User**: Full access including user management and system settings

### Protected Routes
All routes except `/login` and `/register` require authentication.

### Token Management
- JWT tokens stored in both localStorage and cookies
- Automatic token validation on protected routes
- Token cleanup on logout

## 📊 Features

### Core Features
- ✅ User registration and authentication
- ✅ Role-based access control
- ✅ User profile management
- ✅ Dashboard with user statistics
- ✅ Navigation with dropdown menu

### In Development
- 🔄 Campaign creation and management
- 🔄 Donation processing
- 🔄 Payment integration
- 🔄 Reporting and analytics
- 🔄 Email notifications

### Planned Features
- 📋 Campaign categories
- 📋 Social media integration
- 📋 Advanced reporting
- 📋 Mobile responsive design
- 📋 API documentation

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd client
npm run test

# Backend tests
cd server
npm run test
```

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Start production server
cd ../server
npm run start
```

### Environment Setup
- Set production environment variables
- Configure MongoDB Atlas
- Set up SSL certificates
- Configure reverse proxy (nginx)

## 📈 Development Status

### Completed ✅
- Project setup and configuration
- Authentication system
- User management (admin)
- Basic UI components
- Database integration
- State management with Zustand
- Role-based navigation

### Current Sprint 🔄
- Campaign management system
- Donation processing
- Payment integration
- Advanced reporting features

### Backlog 📋
- Email notifications
- Advanced analytics
- Mobile optimization
- API documentation
- Performance optimization

## 🤖 AI Development Guidelines

**🚨 IMPORTANT**: Before making any changes, always check:
- **[AI Development Rules](docs/AI-DEVELOPMENT-RULES.md)** - Complete guidelines
- **[Quick Reference](docs/QUICK-REFERENCE.md)** - Common patterns
- **Existing codebase** - Follow established patterns

## 🤝 Contributing

### Development Workflow
1. **Check Rules First**: Review `docs/AI-DEVELOPMENT-RULES.md`
2. Create feature branch from `main`
3. **Use TODO lists** for complex features (3+ steps)
4. Implement feature following established patterns
5. Test thoroughly
6. Submit pull request
7. Code review and merge

### Coding Standards
- **Always use TypeScript** with proper type definitions
- **Follow React hooks rules** (top-level only)
- **Use Ant Design components** consistently
- **Implement error handling** with user feedback
- **Follow file structure** patterns
- **Test changes** before completion
- **Update documentation** when needed

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Last Updated**: September 2024  
**Version**: 1.0.0  
**Status**: Active Development
