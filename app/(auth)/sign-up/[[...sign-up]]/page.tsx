'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return <SignUp afterSignUpUrl="/dashboard" redirectUrl="/dashboard" />;
} 