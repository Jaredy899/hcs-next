# HCS Case Management System (Next.js)

This is a Next.js version of the Highland County Services Case Management System, built with [Convex](https://convex.dev) as its backend and [Clerk](https://clerk.com) for authentication.

## Features

- Client/Consumer management
- Case notes and documentation
- Quarterly reviews tracking
- Contact information management
- Search and filtering capabilities
- Dark/light theme support
- Responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS, shadcn/ui components
- **Forms**: React Hook Form with Zod validation

## Getting Started

1. Clone the repository
2. Install dependencies

```bash
   pnpm install
```

3.Set up environment variables

- Copy `.env.example` to `.env.local`
- Add your Convex and Clerk configuration

4.Run the development server

```bash
   pnpm dev
```

5.Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Required environment variables:

```sh
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Documentation

- See `CLERK_SETUP.md` for authentication setup instructions
- See `HOTKEYS.md` for keyboard shortcuts and navigation help

## Deployment

This application can be deployed to any platform that supports Next.js. See the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
