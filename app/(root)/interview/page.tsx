import React from 'react'
import Agent from '@/components/Agent'
import { getCurrentUser } from '@/lib/actions/auth.action'

const Page = async() => {
  const user = await getCurrentUser();
  return (
    <div>
<<<<<<< HEAD
      <h3>Interview Generation</h3>
      <Agent userName={user?.name ?? ''} userId={user?.id ?? ''} type="generate" />
=======
        <h3>Interview Generation</h3>
        <Agent userName={user?.name ?? ''} userId={user?.id} type="generate"/>
>>>>>>> 002d4d513950b6d4af250870cdd03285ac2df113
    </div>
  )
}

export default Page
