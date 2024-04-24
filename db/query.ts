import { cache } from "react";
import  db  from "./drizzle";


//get courses
export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany();

    return data
})