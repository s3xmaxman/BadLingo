import { getCourses } from "@/db/query";
import { List } from "./list";

const CoursesPage = async() => {
    const data = await getCourses();

    return (
        <div className="h-full max-w-[912px] px-3 mx-autos">
            <h1 className="text-2xl font-bold text-neutral-700">
                コース
            </h1>
            <List
                courses={data}
                activeCourseId={1} 
            />
        </div>
    )
}

export default CoursesPage;
