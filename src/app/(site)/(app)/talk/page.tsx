"use client";

import { TalkBoard } from "@/components/app/talk/board";
import { Screen } from "@/components/app/ui";

/** Rasmli muloqot (AAC): bola kartani bosadi — ilova uning o'rniga gapiradi. */
export default function TalkPage() {
  return (
    <Screen wide>
      <TalkBoard />
    </Screen>
  );
}
