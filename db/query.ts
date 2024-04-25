import { cache } from "react";
import  db  from "./drizzle";
import { auth } from "@clerk/nextjs";
import { units, userProgress } from "./schema";
import { courses } from "./schema";
import { eq } from "drizzle-orm";



export const getUserProgress = cache(async () => {
 
    const { userId } = await auth();


    if (!userId) {
        return null;
    }

    // ユーザーの進捗状況を取得
    const data = await db.query.userProgress.findFirst({
        // ユーザーIDで絞り込み
        where: eq(userProgress.userId, userId),
        // activeCourseも一緒に取得
        with: {
            activeCourse: true
        }
    });

    return data;
});


export const getUnits = cache(async () => {
    const userProgress = await getUserProgress();

    if(!userProgress?.activeCourseId) {
        return []
    }

    const data = await db.query.units.findMany({
        where: eq(units.courseId, userProgress?.activeCourseId),
        with: {
            lessons: {
                with: {
                    challenges: {
                        with: {
                            challengeProgress: true
                        }
                    }
                }
            }
        }
    });

    const normalizedData = data.map((unit) => {

        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
          if (lesson.challenges.length === 0) {
            return { ...lesson, completed: false };
          }
    
          const allCompletedChallenges = lesson.challenges.every((challenge) => {
            return (
              challenge.challengeProgress &&
              challenge.challengeProgress.length > 0 &&
              challenge.challengeProgress.every((progress) => progress.completed)
            );
          });
    
          return { ...lesson, completed: allCompletedChallenges };
        });
    
        return { ...unit, lessons: lessonsWithCompletedStatus };
    });

    return normalizedData
})


//get course id 
export const getCourseById = cache(async (courseId: number) => {
    const data = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
    });

    return data;
});


//get courses
export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany();

    return data
})

