# Smriti CMS

A Content Management System for managing universities, programs, subjects, and study materials.

## Features

- 🔐 Authentication with NextAuth
- 🎨 Modern UI with shadcn/ui components
- 📊 Dashboard with statistics
- 🏫 Manage Universities, Programs, Subjects, and Study Resources
- 📁 Cloudinary integration for file uploads
- 🔒 Domain-restricted public API (GET-only for client apps)
- 🛡️ Full CRUD API for CMS (authenticated)

## Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **File Upload**: Cloudinary

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudinary account (for file uploads)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smriti-cms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: A random secret string
- `ALLOWED_DOMAINS`: Comma-separated list of allowed domains for public API
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. Run database migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

5. Create an admin user:
```bash
npm run seed:user <email> <password> <name>
# Example:
npm run seed:user admin@example.com admin123 "Admin User"
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Public API (GET-only, domain-restricted)

- `GET /api/public/universities` - Get all universities
- `GET /api/public/programs?universityId=<id>` - Get programs
- `GET /api/public/specializations?programId=<id>` - Get specializations
- `GET /api/public/semesters?programId=<id>&specializationId=<id>` - Get semesters
- `GET /api/public/subjects?termId=<id>` - Get subjects
- `GET /api/public/study-resources?subjectId=<id>` - Get study resources

### CMS API (Full CRUD, authenticated)

- `GET/POST /api/cms/universities` - Manage universities
- `GET/PUT/DELETE /api/cms/universities/[id]` - Manage specific university
- `GET/POST /api/cms/programs` - Manage programs
- `GET/PUT/DELETE /api/cms/programs/[id]` - Manage specific program
- `GET/POST /api/cms/subjects` - Manage subjects
- `GET/PUT/DELETE /api/cms/subjects/[id]` - Manage specific subject
- `POST /api/cms/upload` - Upload files to Cloudinary

## Project Structure

```
smriti-cms/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth routes
│   │   ├── public/       # Public GET-only API
│   │   └── cms/          # CMS CRUD API
│   ├── dashboard/        # CMS dashboard pages
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── sidebar.tsx       # Sidebar navigation
│   └── data-table.tsx    # Reusable data table
├── lib/
│   ├── db/               # Database configuration
│   ├── auth.ts           # NextAuth configuration
│   └── api-middleware.ts # API middleware
└── scripts/
    └── seed-user.ts      # User seeding script
```

## Usage

1. **Login**: Navigate to `/login` and use your admin credentials
2. **Dashboard**: View statistics and overview
3. **Manage Content**: Use the sidebar to navigate to:
   - Universities: Add/edit/delete universities
   - Programs: Manage academic programs
   - Subjects: Manage subjects with syllabus and resources

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT
