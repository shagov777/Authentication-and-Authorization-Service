# PostgreSQL Database Schema Manager

A comprehensive database schema visualization and management platform designed to enhance PostgreSQL database design, documentation, and optimization.

![PostgreSQL Schema Manager](./generated-icon.png)

## 🚀 Features

- **Advanced Schema Visualization** with interactive ER diagrams using React Flow
- **Module-Based Organization** for logical grouping of related tables
- **SQL Generation** for entire schema or specific modules
- **Role-Based Authentication** with secure login/registration
- **TypeScript and React** for a robust frontend experience
- **Express and Drizzle ORM** for efficient backend operations

## 📋 Quick Start

### Prerequisites

- Node.js (v16+)
- PostgreSQL database (local or remote)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   SESSION_SECRET=your-secure-session-secret
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## 🛠️ Architecture

This application follows a modern full-stack architecture:

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui, React Flow, TanStack Query
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Authentication**: Passport.js with local strategy, secure password hashing (scrypt)

## 📊 Database Schema

The application itself uses a database schema consisting of:

- User management (users, roles)
- Schema metadata (tables, columns, modules, relationships)
- User sessions

For more details, see [DATABASE_SCHEMA_STANDARDS.md](./DATABASE_SCHEMA_STANDARDS.md).

## 📘 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - REST API endpoints reference
- [Technical Specification](./TECHNICAL_SPECIFICATION.md) - Authentication details
- [Visualization Tool](./VISUALIZATION_TOOL_DOCUMENTATION.md) - UI components guide
- [Database Standards](./DATABASE_SCHEMA_STANDARDS.md) - Schema design principles

## 🔐 Authentication & Authorization

The system provides complete user management with:

- Secure user registration and login
- Password hashing with salt using scrypt algorithm
- Session-based authentication
- Role-based access control
- Protected API endpoints

## 🔍 Visualization Tools

- **ER Diagram View**: Comprehensive view of all tables and relationships
- **Module View**: Focused view of tables within a specific functional module
- **SQL Generator**: Automatic DDL generation from visual schema

## 🧪 Test Bench

The application includes a test bench for:

- User registration and authentication testing
- Database record inspection
- Permission verification

## 🛡️ Security Considerations

- Passwords are never stored in plain text
- Session data is securely managed
- Input validation on all forms
- API route protection with middleware
- Proper error handling and logging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or issues, please open an issue on this repository.