import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect, Function } from "effect";
import { Tuple } from "effect/data";
import { FileSystem, Path } from "effect/platform";
import { Schema } from "effect/schema";
import { Sink, Stream } from "effect/stream";

const Input = Effect.gen(function* () {
    const path = yield* Path.Path;
    const fs = yield* FileSystem.FileSystem;
    const url = new URL("input.txt", import.meta.url);
    const file = yield* path.fromFileUrl(url);
    return fs.stream(file);
}).pipe(Stream.unwrap);

export const Line = Schema.TemplateLiteralParser([Schema.Literals(["L", "R"]), Schema.NumberFromString]);

export const Folder = Sink.fold<readonly [head: number, count: number], readonly ["L" | "R", number]>(
    () => [50, 0] as readonly [head: number, count: number],
    Function.constTrue,
    ([head, count], [direction, movement]) => {
        if (movement === 0) {
            return Tuple.make(head, count);
        }

        switch (direction) {
            case "L": {
                const inverted = (100 - head) % 100;
                const next = inverted + movement;
                const passes = Math.floor(next / 100);
                const newHead = (100 - (next % 100)) % 100;
                return Tuple.make(newHead, count + passes);
            }

            case "R": {
                const next = head + movement;
                return Tuple.make(next % 100, count + Math.floor(next / 100));
            }
        }
    }
);

Input.pipe(
    Stream.decodeText(),
    Stream.splitLines,
    Stream.mapEffect((line) => Schema.decodeUnknownEffect(Line)(line)),
    Stream.run(Folder),
    Effect.tap(
        Effect.fnUntraced(function* ([head, count]) {
            yield* Effect.log(`Final head position: ${head}`);
            yield* Effect.log(`With a count of: ${count}`);
        })
    ),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
);
