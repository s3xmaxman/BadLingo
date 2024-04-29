import { redirect } from "next/navigation";

import { getLesson, getUserProgress } from "@/db/query";

import { Quiz } from "../quiz";


type Props = {
    params: {
      lessonId: number;
    };
};



const lessonIdPage = async ({ params }: Props) => {
    const lessonData = getLesson(params.lessonId)
    const getUserProgressData = getUserProgress()

    const [ lesson, userProgress ] = await Promise.all([
        lessonData,
        getUserProgressData
    ])

    if(!lesson || !userProgress) {
        redirect('/learn') 
    }

    const initialPercentage = (lesson.challenges
        .filter((challenge) => challenge.completed)
        .length / lesson.challenges.length) * 100;
    
    return (
        <Quiz
            initialLessonId={lesson.id}
            initialLessonChallenges={lesson.challenges}
            initialHearts={userProgress.hearts}
            initialPercentage={initialPercentage}
            userSubscription={null}
        />
    )
}


export default lessonIdPage

