# Online Examination System

A Next.js-based online examination platform for creating, administering, and taking timed quizzes.

## Core capabilities

- Student-facing examination workflow
- Admin-oriented question and user management
- Quiz submission and result tracking
- JWT authentication
- Password hashing with bcrypt
- PostgreSQL persistence
- Responsive React interface

## Technology stack

- Next.js 16
- React 19
- PostgreSQL
- JSON Web Tokens
- bcryptjs
- Framer Motion
- Tailwind CSS

## Local development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create the required environment variables before starting the application. Never commit database credentials or JWT secrets.

## Production checks

Run the production build before deployment:

```bash
npm run build
npm run start
```

Lint the project with:

```bash
npm run lint
```

## Project structure

Application routes and UI live under the Next.js app directory. Authentication, quiz logic, and persistence code are kept alongside the application services used by the examination workflow.

## Security notes

Keep authentication secrets outside source control and use a strong production JWT secret. Validate all user-controlled examination data at the API boundary and preserve authorization checks for administrative operations.
