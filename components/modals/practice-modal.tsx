"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePracticeModal } from "@/store/use-practice-modal";

export const PracticeModal = () => {
    const [isClient, setIsClient] = useState(false);
    const { isOpen, close } = usePracticeModal();

    useEffect(() => setIsClient(true), []);

    if (!isClient) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <div className="flex items-center w-full justify-center mb-5">
                <Image src="/heart.svg" alt="Heart" height={100} width={100} />
            </div>
            <DialogTitle className="text-center font-bold text-2xl">
                練習レッスン
            </DialogTitle>
            <DialogDescription className="text-center text-base">
                練習レッスンではハートとポイントは無くなりません。
            </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mb-4">
            <div className="flex flex-col gap-y-4 w-full">
                <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={close}
                >
                練習レッスンへ
                </Button>
            </div>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
};