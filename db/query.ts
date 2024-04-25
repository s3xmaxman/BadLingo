import { cache } from "react";
import  db  from "./drizzle";
import { auth } from "@clerk/nextjs";
import { userProgress } from "./schema";
import { courses } from "./schema";
import { eq } from "drizzle-orm";


//get user progress
export const getUserProgress = cache(async () => {
    const { userId } = await auth();

    if(!userId) {
        return null
    }

    const data =  await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        with: {
            activeCourse: true
        }
    })

    return data
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

