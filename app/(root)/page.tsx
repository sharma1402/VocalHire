import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import InterviewCard from '@/components/InterviewCard'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { getInterviewsByUserId, getLatestInterviews } from '@/lib/actions/general.action'

const Page = async () => {
  const user = await getCurrentUser();

  let userInterviews: any[] = [];
  let allInterviews: any[] = [];

  if (user) {
    // Logged in
    [userInterviews, allInterviews] = await Promise.all([
      getInterviewsByUserId(user.id),
      getLatestInterviews({ userId: "" }) // fetch ALL
    ]).then(([interviews, latest]) => [
      interviews ?? [],
      latest ?? []
    ]);
  } else {
    //Guest → fetch ALL interviews
    allInterviews = (await getLatestInterviews({ userId: "" })) ?? [];
  }

  //Only for logged in: separate others
  const otherInterviews = user
    ? allInterviews.filter(
        (interview) => interview.userId !== user.id
      )
    : allInterviews;

  return (
    <>
      {/* HERO */}
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>

          <p className="text-lg">
            Practice on real interview questions, receive instant AI feedback, and boost your confidence.
          </p>

          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href={user ? "/interview" : "/sign-in"}>Start an Interview</Link>
          </Button>
        </div>

        <Image 
          src="/robot.png" 
          alt="robo-dude" 
          width={400} 
          height={400} 
          className="max-sm:hidden"
        />
      </section>

      {user && (
        <section className='flex flex-col gap-6 mt-2'>
          <h2>Your Interviews</h2>

          <div className='interviews-section'>
            {userInterviews.length > 0 ? (
              userInterviews.map((interview) => (
                <InterviewCard {...interview} user={user} key={interview.id}/>
              ))
            ) : (
              <p>You haven't taken any interview yet!</p>
            )}
          </div>
        </section>
      )}

      {/* Everyone sees this */}
      <section className='flex flex-col gap-6 mt-2'>
        <h2>{user ? "Take an Interview" : "All Interviews"}</h2>

        <div className="interviews-section">
          {otherInterviews.length > 0 ? (
            otherInterviews.map((interview) => (
              <InterviewCard {...interview} user={user} key={interview.id}/>
            ))
          ) : (
            <p>No interviews available</p>
          )}
        </div>
      </section>
    </>
  )
}

export default Page