import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { isAdmin } from "@/lib/admin";


export const GET = async (req: Request, { params }: { params: { coursesId: number } }) => {

    if(!isAdmin()) {
        return new Response("Unauthorized", { status: 403 })
    }

    const data = await db.query.courses.findFirst({ where: eq(courses.id, params.coursesId) })
   
    return NextResponse.json(data)
}


export const PUT = async (req: Request, { params }: { params: { coursesId: number } }) => {
    if(!isAdmin()) {
        return new Response("Unauthorized", { status: 403 })
    }

    const body = await req.json()
    
    const data = await db
    .update(courses)
    .set({ ...body })
    .where(eq(courses.id, params.coursesId))
    .returning()
    
    return NextResponse.json(data[0])
}


export const DELETE = async (req: Request, { params }: { params: { coursesId: number } }) => {

    if(!isAdmin()) {
        return new Response("Unauthorized", { status: 403 })
    }

    const data = await db
    .delete(courses)
    .where(eq(courses.id, params.coursesId))
    .returning()
    
    return NextResponse.json(data[0])
}