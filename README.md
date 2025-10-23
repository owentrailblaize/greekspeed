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
**For Development Work:**
Start working on a new feature
```bash
git checkout develop

# Make your changes
# ... code changes ...

# Commit and push to test
git add .
git commit -m "Add new feature: description"
git push origin develop

# Test on greekspeed.vercel.app
# Once satisfied, merge to production
```

**For Production Deployment:**
```bash
# Merge develop to main
git checkout main
git merge develop
git push origin main
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