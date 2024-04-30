"use client"

import { challengeOptions, challenges, userSubscriptions } from "@/db/schema";
import { useState, useTransition } from "react";
import { Header } from "./header";
import Confetti from "react-confetti";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { toast } from "sonner";
import { reduceHearts } from "@/actions/user-progress";
import { useAudio, useWindowSize, useMount } from "react-use";
import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";


type Props = {
    initialPercentage: number;
    initialHearts: number;
    initialLessonId: number;
    initialLessonChallenges: (typeof challenges.$inferSelect & {
      completed: boolean;
      challengeOptions: (typeof challengeOptions.$inferSelect)[];
    })[];
    userSubscription: typeof userSubscriptions.$inferSelect & {
        isActive: boolean;
    } | null;
};


export const Quiz = ({ initialPercentage, initialHearts, initialLessonId, initialLessonChallenges, userSubscription }: Props) => {
    const { open: openHeartsModal } = useHeartsModal();

    const { open: openPracticeModal } = usePracticeModal();

    useMount(() => {
       if(initialPercentage === 100) {
            openPracticeModal() 
       }
    });

    const { width, height } = useWindowSize();

    const router = useRouter();

    const [ finishAudio ] = useAudio({ src: "/taco_truck.mp3", autoPlay: true });

    const [ correctAudio, _c, correctControls ] = useAudio({ src: "/correct.wav" });

    const [ incorrectAudio, _i, incorrectControls ] = useAudio({ src: "/incorrect.wav" });

    const [ pending, startTransition ] = useTransition();

    const [ lessonId ] = useState(initialLessonId);

    const [ hearts, setHearts ] = useState(initialHearts);

    const [ percentage, setPercentage ] = useState(() => {
        return initialPercentage === 100 ? 0 : initialPercentage;
    });

    const [ challenges ]= useState(initialLessonChallenges)

    const [ activeIndex, setActiveIndex ] = useState(() => {
        const uncompletedIndex = challenges.findIndex(
          (challenge) => !challenge.completed
        );
        return uncompletedIndex === -1 ? 0 : uncompletedIndex;
    });

    const [ selectedOption, setSelectedOption ] = useState<number>();
    
    const [ status, setStatus ] = useState<"correct" | "wrong" | "none">("none");

    const challenge = challenges[activeIndex];

    const options = challenge?.challengeOptions ?? [];


    const onNext = () => {
        setActiveIndex((current) => current + 1);
    }
    
    const onSelect = (id: number) => {
       if(status !== "none") return;

       setSelectedOption(id)
    };

    const onContinue = () => {
        // 選択肢が選択されていない場合は何もしない
        if(!selectedOption) return;

        // 回答が間違っていた場合
        if(status === "wrong") {
            // 状態を "none" に戻す
            setStatus("none");
            // 選択肢の選択を解除する
            setSelectedOption(undefined);
            return;
        }

        // 回答が正解だった場合
        if(status === "correct") {
            // 次の問題に進む
            onNext();
            // 状態を "none" に戻す
            setStatus("none");
            // 選択肢の選択を解除する
            setSelectedOption(undefined);
            return;
        }

        // 正解の選択肢を取得する
        const correctOption = options.find((option) => option.correct);

        // 正解の選択肢がない場合は何もしない
        if(!correctOption) return;

        // 選択した選択肢が正解だった場合
        if(correctOption.id === selectedOption) {
            startTransition(() => {
                // 問題の進捗を更新する
                upsertChallengeProgress(challenge.id)
                .then((response) => {
                    // ハートが足りない場合はモーダルを表示する
                    if(response?.error === "hearts") {
                        openHeartsModal();
                        return;
                    }
                    
                    // 正解の音声を再生する
                    correctControls.play();
                    // 状態を "correct" に設定する
                    setStatus("correct");
                    // 進捗率を更新する
                    setPercentage((prev) => prev + 100 / challenges.length);

                    // 初期進捗率が100%の場合はハートを1つ増やす
                    if(initialPercentage === 100) {
                        setHearts((prev) => Math.min(prev + 1, 5));
                    }
                })
                .catch(() => toast.error("エラーが発生しました"))
            })
        } 
        // 選択した選択肢が間違っていた場合
        else {
            startTransition(() => {
                // ハートを1つ減らす
                reduceHearts(challenge.id)
                .then((response) => {
                    // ハートが足りない場合はモーダルを表示する
                    if(response?.error === "hearts") {
                        openHeartsModal();
                        return;
                    }
                    
                    // 間違いの音声を再生する
                    incorrectControls.play();
                    // 状態を "wrong" に設定する
                    setStatus("wrong");

                    // エラーがない場合はハートを1つ減らす
                    if(!response?.error) {
                        setHearts((prev) => Math.max(prev - 1, 0));
                    }
                })
                .catch(() => toast.error("エラーが発生しました"))
            })    
        }
    };


    if (!challenge) {
        return (
          <>
            {finishAudio}
            <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={500}
                tweenDuration={10000}
            />
            <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
              <Image
                    src="/finish.svg"
                    alt="Finish"
                    className="hidden lg:block"
                    height={100}
                    width={100}
              />
              <Image
                    src="/finish.svg"
                    alt="Finish"
                    className="block lg:hidden"
                    height={50}
                    width={50}
              />
              <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
                おめでとうございます！レッスンを完了しました。
              </h1>
              <div className="flex items-center gap-x-4 w-full">
                    <ResultCard variant="points" value={challenges.length * 10} />
                    <ResultCard variant="hearts" value={hearts} />
              </div>
            </div>
            <Footer
                lessonId={lessonId}
                status="completed"
                onCheck={() => router.push("/learn")}
            />
          </>
        );
    }
    

    const title = challenge.type === "ASSIST" ? "Select the correct meaning" : challenge.question;


    return (
        <>
            {correctAudio}
            {incorrectAudio}
            <Header
                hearts={hearts} 
                percentage={percentage}
                hasActiveSubscription={!!userSubscription?.isActive}
            />
            <div className="flex-1">
                <div className="h-full flex items-center justify-center">
                    <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
                        <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                            {title}
                        </h1>
                        <div>
                        {challenge.type === "ASSIST" && (
                            <QuestionBubble question={challenge.question} />
                        )}
                        <Challenge
                           options={options}
                           onSelect={onSelect}
                           status={status}
                           selectedOption={undefined}
                           disabled={false}
                           type={challenge.type}
                        />
                        </div>
                    </div>
                </div>
            </div>
           <Footer
               disabled={pending || !selectedOption}
               status={status}
               onCheck={onContinue}
           />    
        </>
    )
}
