import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";


// コースのテーブル定義
export const courses = pgTable("courses", {
  id: serial("id").notNull().primaryKey(), // コースのID
  title: text("title").notNull(), // コースのタイトル
  imageSrc: text("image_src").notNull(), // コースの画像のソース
});

// コースとユーザーの進捗状況の関係
export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress), // コースの進捗状況
  units: many(units), // コースに属するユニット
}));

// ユニットのテーブル定義
export const units = pgTable("units", {
  id: serial("id").primaryKey(), // ユニットのID
  title: text("title").notNull(), // ユニットのタイトル
  description: text("description").notNull(), // ユニットの説明
  courseId: integer("course_id") // コースのID
    .references(() => courses.id, { onDelete: "cascade" }) // コースとの関係
    .notNull(),
  order: integer("order").notNull(), // ユニットの順序
});

// ユニットとレッスンの関係
export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, { // ユニットが属するコース
      fields: [units.courseId],
      references: [courses.id],
  }),
  lessons: many(lessons), // ユニットに属するレッスン
}));

// レッスンのテーブル定義
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(), // レッスンのID
  title: text("title").notNull(), // レッスンのタイトル
  unitId: integer("unit_id") // ユニットのID
    .references(() => units.id, { onDelete: "cascade" }) // ユニットとの関係
    .notNull(),
  order: integer("order").notNull(), // レッスンの順序
});

// レッスンとチャレンジの関係
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, { // レッスンが属するユニット
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges), // レッスンに属するチャレンジ
}));


export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);


export const challenges = pgTable("challenges", {
    id: serial("id").primaryKey(), // プライマリキーとして自動インクリメントされる ID
    lessonId: integer("lesson_id") // レッスン ID
      .references(() => lessons.id, { onDelete: "cascade" }) // lessons テーブルの ID を参照
      .notNull(),
    type: challengesEnum("type").notNull(), // チャレンジのタイプ (enum 型)
    question: text("question").notNull(), // チャレンジの質問
    order: integer("order").notNull(), // 表示順序
});


// challenges テーブルと他のテーブルのリレーションを定義します
export const challengesRelations = relations(challenges, ({ one, many }) => ({
    lesson: one(lessons, { // レッスンテーブルとの 1:1 リレーションを設定
      fields: [challenges.lessonId], // challenges テーブルの lesson_id フィールド
      references: [lessons.id], // lessons テーブルの id フィールドを参照
    }),
    challengeOptions: many(challengeOptions), // チャレンジオプションテーブルとの 1:N リレーション
    challengeProgress: many(challengeProgress), // チャレンジ進捗状況テーブルとの 1:N リレーション
}));


export const challengeOptions = pgTable("challenge_options", {
    id: serial("id").primaryKey(), // プライマリキーとして自動インクリメントされる ID
    challengeId: integer("challenge_id") // チャレンジ ID
      .references(() => challenges.id, { onDelete: "cascade" }) // challenges テーブルの ID を参照
      .notNull(),
    text: text("text") // オプションのテキスト
      .notNull(),
    correct: boolean("correct") // 正解かどうか
      .notNull(),
    imageSrc: text("image_src"), // オプションの画像ソース
    audioSrc: text("audio_src"), // オプションの音声ソース
});


// チャレンジオプションテーブルとチャレンジテーブルのリレーションを定義します
export const challengeOptionsRelations = relations(
    challengeOptions,
    ({ one }) => ({
      challenge: one(challenges, { // challenges テーブルとの 1:1 リレーションを設定
        fields: [challengeOptions.challengeId], // challenge_options テーブルの challenge_id フィールド
        references: [challenges.id], // challenges テーブルの id フィールドを参照
      }),
    })
);


// チャレンジの進捗状況を管理するテーブルを定義します
export const challengeProgress = pgTable("challenge_progress", {
    id: serial("id").primaryKey(), // プライマリキーとして自動インクリメントされる ID
    userId: text("user_id") // ユーザー ID。null 値は許可しない
      .notNull(),
    challengeId: integer("challenge_id") // チャレンジ ID
      .references(() => challenges.id, { onDelete: "cascade" }) // challenges テーブルの ID を参照
      .notNull(),
    completed: boolean("completed") // チャレンジの完了状態
      .notNull()
      .default(false), // デフォルトは未完了
  });

// チャレンジ進捗状況テーブルとチャレンジテーブルのリレーションを定義します
export const challengeProgressRelations = relations(
    challengeProgress,
    ({ one }) => ({
      challenge: one(challenges, { // challenges テーブルとの 1:1 リレーションを設定
        fields: [challengeProgress.challengeId], // challenge_progress テーブルの challenge_id フィールド
        references: [challenges.id], // challenges テーブルの id フィールドを参照
      }),
    })
);


// ユーザーの進捗状況を管理するテーブルを定義します
export const userProgress = pgTable("user_progress", {
    userId: text("user_id") // プライマリキー: ユーザー ID
        .primaryKey(),
    userName: text("user_name") // ユーザーの名前
        .notNull() // NULL 値を許可しない
        .default("User"), // デフォルト値を "User" に設定
    userImageSrc: text("user_image_src") // ユーザーのプロフィール画像のソース
        .notNull() // NULL 値を許可しない
        .default("/mascot.svg"), // デフォルト画像を mascot.svg に設定
    activeCourseId: integer("active_course_id") // 現在受講中のコース ID
        .notNull() // NULL 値を許可しない
        .references(() => courses.id, { // コーステーブルへの外部キー制約
            onDelete: "cascade", // ユーザー進捗データを削除するときに関連するコースデータも削除
        }),
    hearts: integer("hearts") // ユーザーのハート数
        .notNull() // NULL 値を許可しない
        .default(5), // デフォルト値を 5 に設定
    points: integer("points") // ユーザーのポイント数
        .notNull() // NULL 値を許可しない
        .default(0), // デフォルト値を 0 に設定
})


// ユーザーの進捗状況とコースの関係を定義します
export const userProgressRelations = relations(userProgress, ({ one }) => ({
    activeCourse: one(courses, { // 現在受講中のコースとの関係
      fields: [userProgress.activeCourseId], // 外部キー: activeCourseId
      references: [courses.id], // 参照するキー: courses.id
    }),
}));


// ユーザーのサブスクリプション情報を管理するテーブルを定義します
export const userSubscriptions = pgTable("user_subscriptions", {
    id: serial("id").primaryKey(), // プライマリキーとして自動採番される ID
    userId: text("user_id") // 外部キー: ユーザー ID
        .notNull() // NULL 値を許可しない
        .unique(), // ユニークな値であることを保証
    stripeCustomerId: text("stripe_customer_id") // Stripe カスタマー ID
        .notNull() // NULL 値を許可しない
        .unique(), // ユニークな値であることを保証
    stripeSubscriptionId: text("stripe_subscription_id") // Stripe サブスクリプション ID
        .notNull() // NULL 値を許可しない
        .unique(), // ユニークな値であることを保証
    stripePriceId: text("stripe_price_id") // Stripe プラン ID
        .notNull(), // NULL 値を許可しない
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end") // サブスクリプション期間の終了日時
        .notNull(), // NULL 値を許可しない
});