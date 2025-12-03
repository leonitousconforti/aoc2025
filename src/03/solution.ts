import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { FileSystem, Path } from "effect/platform";
import { Stream } from "effect/stream";

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const Input = Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = new URL("input.txt", import.meta.url);
    const file = yield* path.fromFileUrl(url);
    return fs.stream(file);
})
    .pipe(Stream.unwrap)
    .pipe(Stream.decodeText())
    .pipe(Stream.splitLines)
    .pipe(Stream.map((line) => line.split("").map(Number) as Array<Digit>));

export const largestInBankPart1 = (bank: Array<Digit>): number => {
    const lastIndexes: { [D in Digit]?: number | undefined } = {};
    const firstIndexes: { [D in Digit]?: number | undefined } = {};

    for (let i = 0; i < bank.length; i++) {
        const d = bank[i]!;
        if (i > (lastIndexes[d] ?? Number.NEGATIVE_INFINITY)) lastIndexes[d] = i;
        if (i <= (firstIndexes[d] ?? Number.POSITIVE_INFINITY)) firstIndexes[d] = i;
    }

    for (let i = 9; i >= 0; i--) {
        const firstIndex = firstIndexes[i as Digit];
        if (firstIndex === undefined) continue;

        for (let j = 9; j >= 0; j--) {
            const lastIndex = lastIndexes[j as Digit];
            if (lastIndex === undefined) continue;
            if (firstIndex < lastIndex) return i * 10 + j;
        }
    }

    return 0;
};

export const largestInBankPart2 = (bank: Array<Digit>, count: number, lastFindIndex: number = 0): number => {
    // Base case
    if (count === 0) {
        return 0;
    }

    // Base case
    if (count >= bank.length) {
        let x = 0;
        for (let y = 0; y < bank.length; y++) {
            x += bank[y]! * Math.pow(10, count - y - 1);
        }
        return x;
    }

    let bestIndex = lastFindIndex,
        best = Number.NEGATIVE_INFINITY;

    for (let i = bestIndex; i < bank.length - count + 1; i++) {
        const current = bank[i]!;
        if (current > best) {
            best = current;
            bestIndex = i;
        }
    }

    return best * Math.pow(10, count - 1) + largestInBankPart2(bank, count - 1, bestIndex + 1);
};

Input.pipe(
    Stream.map((bank) => largestInBankPart2(bank, 12)),
    Stream.runSum,
    Effect.tap((joltage) => Effect.logInfo(`Total output joltage: ${joltage}`)),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
