# Authentication & Authorization Service

A secure and scalable authentication and authorization service built with Node.js, Express, and PostgreSQL.

## Features

- User registration and login
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Account lockout after failed attempts
- Two-factor authentication (2FA)
- Password reset functionality
- Audit logging

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Drizzle ORM
- TypeScript
- JWT
- bcrypt
- Zod (validation)

## Prerequisites

- Node.js 20 or later
- Docker and Docker Compose
- PostgreSQL 15 or later

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/auth-service.git
cd auth-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development environment:
```bash
docker-compose up
```

The service will be available at `http://localhost:3000`.

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API documentation.

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Running in Production
```bash
npm start
```

## Docker Deployment

The service is containerized and can be deployed using Docker:

```bash
# Build the image
docker build -t auth-service .

# Run the container
docker run -p 3000:3000 auth-service
```

For production deployment, use the provided `docker-compose.prod.yml` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.