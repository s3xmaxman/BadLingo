"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { challengeProgress, challenges, userProgress } from "@/db/schema";
import { getUserProgress } from "@/db/query";
import { error } from "console";



export const upsertChallengeProgress = async (challengeId: number) => {

    const { userId } = await auth();

    if(!userId) {
        throw new Error('認証されていません')
    }

    const currentUserProgress = await getUserProgress();
    // TODO: 進捗状況を取得

    if(!currentUserProgress) {
        throw new Error('ユーザーの進捗状況が見つかりません')
    }

    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId)
    })

    if(!challenge) {
        throw new Error('チャレンジが見つかりません')
    }

    const lessonId = challenge.lessonId;

    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
        where: and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, challengeId)
        ),
    });

    const isPractice = !!existingChallengeProgress
    //Todo Not if user has a subs 
    if(currentUserProgress.hearts === 0 && !isPractice) {
        return { error: 'hearts' }
    }

    if(isPractice){
        await db.update(challengeProgress).set({
            completed: true,
        }).where(
            eq(challengeProgress.id, existingChallengeProgress.id),
        )

        await db
        .update(userProgress)
        .set({
          hearts: Math.min(currentUserProgress.hearts + 1, 5),
          points: currentUserProgress.points + 10,
        })
        .where(eq(userProgress.userId, userId));
  
        revalidatePath("/learn");
        revalidatePath("/lesson");
        revalidatePath("/quests");
        revalidatePath("/leaderboard");
        revalidatePath(`/lesson/${lessonId}`);
        return;
    }

    await db.insert(challengeProgress).values({
        userId,
        challengeId,
        completed: true,
    });

    await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
    })
    .where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
    return;
}