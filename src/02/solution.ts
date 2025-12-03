import * as assert from "node:assert/strict";

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { Filter } from "effect/data";
import { FileSystem, Path } from "effect/platform";
import { Schema } from "effect/schema";
import { Stream } from "effect/stream";

const Input = Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = new URL("input.txt", import.meta.url);
    const file = yield* path.fromFileUrl(url);
    const data = yield* fs.readFileString(file);
    return data.split(",");
});

export const ProjectIdRange = Schema.TemplateLiteralParser([
    Schema.NumberFromString,
    Schema.Literal("-"),
    Schema.NumberFromString,
]);

export const IsInvalidProjectIdNaive = Filter.make((number: number) => {
    const str = String(number);
    const numDigits = str.split("").length;

    let jump = Math.floor(numDigits / 2);
    while (jump > 0) {
        if (numDigits % jump !== 0) {
            jump = jump - 1;
            continue;
        }

        const subject = str.substring(0, jump).repeat(numDigits / jump);
        assert.ok(subject.length === str.length, "lengths should equal");

        if (subject === str) return number;
        else jump = jump - 1;
    }

    return Filter.failVoid;
});

export const IsInvalidProjectId = Filter.make((number: number) => {
    const str = String(number);
    const digits = str.split("").map(Number);

    let jump = Math.floor(digits.length / 2);
    while (jump > 0) {
        if (digits.length % jump !== 0) {
            jump = jump - 1;
            continue;
        }

        let i = 0,
            j = jump;

        for (i = 0; i < jump; i++) {
            const leftmost = digits[i];
            for (j = i + jump; j < digits.length; j += jump) {
                const jumpOccurance = digits[j];
                if (leftmost !== jumpOccurance) break;
            }

            if (j - i !== digits.length) {
                break;
            }
        }

        if (i === jump && j - jump + 1 === digits.length) {
            return number;
        }

        jump = jump - 1;
    }

    return Filter.failVoid;
});

Stream.fromIterableEffect(Input).pipe(
    Stream.mapEffect((range) => Schema.decodeUnknownEffect(ProjectIdRange)(range)),
    Stream.flatMap(([startInclusive, _, endInclusive]) => Stream.range(startInclusive, endInclusive)),
    Stream.filter(IsInvalidProjectId),
    Stream.runSum,
    Effect.tap((count) => Effect.log(`Total from bad project ids: ${count}`)),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
