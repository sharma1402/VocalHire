"use client";

import AuthForm from '@/components/AuthForm'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const Page = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  return <AuthForm type="sign-in" redirectTo={redirectTo} />
}

export default Page;