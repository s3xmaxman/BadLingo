import { cache } from "react";
import  db  from "./drizzle";
import { auth } from "@clerk/nextjs";
import { challengeProgress, lessons, units, userProgress, userSubscriptions } from "./schema";
import { courses } from "./schema";
import { eq } from "drizzle-orm";


//ユーザーの進捗状況を取得する関数
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


//ユーザーのアクティブなコースのユニットを取得する関数
export const getUnits = cache(async () => {

    const { userId } = await auth();

    const userProgress = await getUserProgress();

    if (!userId || !userProgress?.activeCourseId) {
      return [];
    }

    // アクティブなコースに含まれるユニットを取得する
    const data = await db.query.units.findMany({
      // ユニットを順番に取得する
      orderBy: (units, { asc }) => [asc(units.order)],
      // アクティブなコースIDに一致するユニットを取得する
      where: eq(units.courseId, userProgress.activeCourseId),
      with: {
        lessons: {
          // レッスンを順番に取得する
          orderBy: (lessons, { asc }) => [asc(lessons.order)],
          with: {
            // レッスンに含まれるチャレンジデータも取得する
            challenges: {
              // チャレンジを順番に取得する
              orderBy: (challenges, { asc }) => [asc(challenges.order)],
              with: {
                // チャレンジの進捗状況も取得する
                challengeProgress: {
                  where: eq(
                    challengeProgress.userId,
                    userId,
                  ),
                },
              },
            },
          },
        },
      },
    });

    // 取得したユニットデータを整形する
    const normalizedData = data.map((unit) => {
      // レッスンの完了状況を追加する
      const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
        // チャレンジがない場合は未完了とする
        if (
          lesson.challenges.length === 0
        ) {
          return { ...lesson, completed: false };
        }

        // すべてのチャレンジが完了している場合は完了とする
        const allCompletedChallenges = lesson.challenges.every((challenge) => {
          return challenge.challengeProgress
            && challenge.challengeProgress.length > 0
            && challenge.challengeProgress.every((progress) => progress.completed);
        });

        return { ...lesson, completed: allCompletedChallenges };
      });

      // 整形したユニットデータを返す
      return { ...unit, lessons: lessonsWithCompletedStatus };
    });

    // 整形したユニットデータを返す
    return normalizedData;
});


// コースIDを受け取り、コースの情報を取得する関数
export const getCourseById = cache(async (courseId: number) => {
    // データベースからコースの情報を取得する
    const data = await db.query.courses.findFirst({
      // コースIDが一致するレコードを検索
      where: eq(courses.id, courseId),
      // ユニットとレッスンの情報も取得する
      with: {
        units: {
          // ユニットを順番に並べる
          orderBy: (units, { asc }) => [asc(units.order)],
          with: {
            lessons: {
              // レッスンを順番に並べる
              orderBy: (lessons, { asc }) => [asc(lessons.order)],
            },
          },
        },
      },
    });

    return data;
});


//すべてのコース情報を取得する関数
export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany();

    return data
})




//コースの進捗状況を取得する関数
export const getCourseProgress = cache(async () => {
 
    const { userId } = await auth();

    const userProgress = await getUserProgress();
  

    if (!userId || !userProgress?.activeCourseId) {
      return null;
    }
  
    // アクティブなコースに含まれるユニットを取得する
    const unitsInActiveCourse = await db.query.units.findMany({
      // ユニットを順番に取得する
      orderBy: (units, { asc }) => [asc(units.order)],
      // アクティブなコースIDに一致するユニットを取得する
      where: eq(units.courseId, userProgress.activeCourseId),
      with: {
        lessons: {
          // レッスンを順番に取得する
          orderBy: (lessons, { asc }) => [asc(lessons.order)],
          with: {
            // レッスンに関連するユニットデータも取得する
            unit: true,
            // レッスンに含まれるチャレンジデータも取得する
            challenges: {
              with: {
                // チャレンジの進捗状況も取得する
                challengeProgress: {
                  where: eq(challengeProgress.userId, userId),
                },
              },
            },
          },
        },
      },
    });
  
    // 未完了のレッスンを見つける
    const firstUncompletedLesson = unitsInActiveCourse
      .flatMap((unit) => unit.lessons)
      .find((lesson) => {
        return lesson.challenges.some((challenge) => {
          return (
            !challenge.challengeProgress ||
            challenge.challengeProgress.length === 0 ||
            challenge.challengeProgress.some(
              (progress) => progress.completed === false
            )
          );
        });
      });
  
    // アクティブなレッスンとレッスンIDを返す
    return {
      activeLesson: firstUncompletedLesson,
      activeLessonId: firstUncompletedLesson?.id,
    };
});



//レッスンデータを取得する関数
export const getLesson = cache(async (id?: number) => {

    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const courseProgress = await getCourseProgress();
    
    const lessonId = id || courseProgress?.activeLessonId;

    if (!lessonId) {
        return null;
    }

    // データベースからレッスンデータを取得する
    const data = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
          challenges: {
            // チャレンジを順番に取得する
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              // チャレンジのオプションと進捗状況も取得する
              challengeOptions: true,
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
    });


    // レッスンデータまたはチャレンジデータが存在しない場合はnullを返す
    if(!data || !data.challenges) {
        return null
    }

    // チャレンジの進捗状況を正規化する
    const normalizedChallenges = data.challenges.map((challenge) => {
        const completed = 
        challenge.challengeProgress &&
        challenge.challengeProgress.length > 0 &&
        challenge.challengeProgress.every((progress) => progress.completed);
        
        return {...challenge, completed}
    })

    // レッスンデータと正規化されたチャレンジデータを返す
    return {...data, challenges: normalizedChallenges}
})



//レッスンのパーセンテージを取得
export const getLessonPercentage = cache(async () => {

    const courseProgress = await getCourseProgress();

    if(!courseProgress?.activeLessonId) {
        return 0
    }

    const lesson = await getLesson(courseProgress.activeLessonId);

    if(!lesson) {
        return 0
    }

    // レッスンの完了済みのチャレンジを取得
    const completedChallenges = lesson.challenges.filter((challenge) => challenge.completed);
    
    // 完了済みのチャレンジ数 / 全チャレンジ数 * 100 で完了率を計算
    const percentage = (completedChallenges.length / lesson.challenges.length) * 100;
    
    // 完了率を返す
    return percentage
})


// 1日のミリ秒数
const DAY_IN_MS = 86_400_000;

// ユーザーのサブスクリプション情報を取得する関数
export const getUserSubscription = cache(async () => {
    

    const { userId } = await auth();

    if(!userId) {
        return null
    }

    // ユーザーのサブスクリプション情報を取得
    const data = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, userId),
    })

    if(!data) {
        return null
    }

    // サブスクリプションが有効かどうかを判定
    // stripePriceIdがあり、かつ現在の期間終了日が今日より後の場合は有効
    const isActive =
    data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

    return { ...data, isActive: !!isActive }
})



//上位10人のユーザー情報を取得する関数
export const getTopTenUsers = cache(async () => {

    const { userId } = await auth();

    if(!userId) {
        return []
    }

    // データベースからユーザーの進捗情報を取得する
    // ポイントの降順でソート、上位10件を取得する
    const data = await db.query.userProgress.findMany({

        orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
        limit: 10,
        columns: {
            userId: true,
            userName: true,
            userImageSrc: true,
            points: true
        }
    })

    return data
})