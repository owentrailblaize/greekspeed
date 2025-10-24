# Trailblaize - Alum Networking Platform
A comprehensive platform for Greek life chapter management, alumni networking, and dues administration built with Next.js and Supabase.

----
## Start Guide
**Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

**Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/owentrailblaize/greekspeed.git
   cd greekspeed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Email/SMS
   SENDGRID_API_KEY=your_sendgrid_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---
## Commit Workflow
#### Option 1: Feature Branch Workflow (Recommended)
**For New Features:**
Start working on a new feature
```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create a new feature branch
git checkout -b feature/your-feature-name

# 3. Work on your feature
# ... make changes ...

# 4. Commit your changes
git add .
git commit -m "feat: add new alumni card component"

# 5. Push feature branch to GitHub
git push origin feature/your-feature-name

# 6. Create Pull Request from feature branch → develop branch
# (Do this in GitHub UI)

# 7. After PR is approved and merged, delete the feature branch
git checkout develop
git pull origin develop
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

**For Bug Fixes:**
```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create a bugfix branch
git checkout -b bugfix/fix-login-issue

# 3. Fix the bug and commit
git add .
git commit -m "fix: resolve login authentication issue"

# 4. Push and create PR to develop
git push origin bugfix/fix-login-issue
```
#### Option 2: Direct Development Workflow (Simpler)
If you prefer to work directly on the develop branch:
```bash
# 1. Switch to develop branch
git checkout develop
git pull origin develop

# 2. Make your changes
# ... work on features ...

# 3. Commit and push directly to develop
git add .
git commit -m "feat: add new feature"
git push origin develop

# This will automatically deploy to greekspeed.vercel.app
```
**Production Deployment Workflow:**
When Ready for Production:
```bash
# 1. Make sure develop branch is up to date
git checkout develop
git pull origin develop

# 2. Switch to main branch
git checkout main
git pull origin main

# 3. Merge develop into main
git merge develop

# 4. Push to main (this deploys to trailblaize.net)
git push origin main

# 5. Tag the release (optional but recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```


----
## Project Structure
```bash
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   ├── (marketing)/             # Marketing pages
│   ├── api/                     # API routes
│   ├── dashboard/               # Protected dashboard pages
│   └── layout.tsx               # Root layout
├── components/                  # Reusable components
│   ├── ui/                      # Base UI components
│   ├── dashboards/              # Dashboard-specific components
│   └── messaging/               # Chat/messaging components
├── lib/                         # Utilities and services
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom hooks
│   ├── services/                # API services
│   └── supabase/                # Supabase configuration
├── types/                       # TypeScript type definitions
└── styles/                      # Global styles
```
----
## Key Features
- **Alumni Network**: LinkedIn-style alumni directory and networking
- **Dues Management**: Payment processing and financial tracking
- **Chapter Administration**: Role-based access and management tools
- **Messaging**: Real-time chat and SMS notifications
- **Events**: Event creation and management
- **Dashboard**: Comprehensive analytics and overview

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment
The application uses environment-based configuration. Ensure all required environment variables are set before running the application.

## Support
For development questions or issues, refer to the project documentation or contact the development team.