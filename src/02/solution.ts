import * as assert from "node:assert/strict";

import { FileSystem, Path } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, ParseResult, Schema, Stream, Tuple } from "effect";

const Input = Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = new URL("input.txt", import.meta.url);
    const file = yield* path.fromFileUrl(url);
    const data = yield* fs.readFileString(file);
    return data.split(",");
});

export class ProjectIdRange extends Schema.transformOrFail(
    Schema.TemplateLiteralParser(Schema.NumberFromString, Schema.Literal("-"), Schema.NumberFromString),
    Schema.Tuple(Schema.Number, Schema.Number),
    {
        encode: ([start, end]) => ParseResult.succeed([start, "-", end] as const),
        decode: ([start, _, end], _options, ast) => {
            if (start <= end) {
                return ParseResult.succeed([start, end] as const);
            } else {
                return ParseResult.fail(
                    new ParseResult.Type(
                        ast,
                        Tuple.make(start, end),
                        `Start of range must be less than or equal to end`
                    )
                );
            }
        },
    }
) {}

export const IsInvalidProjectIdNaive = (number: number): boolean => {
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

        if (subject === str) return true;
        else jump = jump - 1;
    }

    return false;
};

export const IsInvalidProjectId = (number: number): boolean => {
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
            return true;
        }

        jump = jump - 1;
    }

    return false;
};

Stream.fromIterableEffect(Input).pipe(
    Stream.mapEffect(Schema.decodeUnknown(ProjectIdRange)),
    Stream.flatMap(([startInclusive, endInclusive]) => Stream.range(startInclusive, endInclusive)),
    Stream.filter(IsInvalidProjectId),
    Stream.runSum,
    Effect.tap((count) => Effect.log(`Total from bad project ids: ${count}`)),
    Effect.provide(NodeContext.layer),
    NodeRuntime.runMain
);
