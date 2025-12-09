const raw = `
..@@.@@@@.
@@@.@.@.@@
@@@@@.@.@@
@.@@@@..@.
@@.@@@@.@@
.@@@@@@@.@
.@.@.@.@@@
@.@@@.@@@@
.@@@@@@@@.
@.@.@@@.@.
`;

const input = raw
    .trim()
    .split("\n")
    .map((line) => line.split(""));

let total = 0,
    lastTotal = 0;

const rows = input.length;
const cols = input[0]!.length;

do {
    lastTotal = total;
    const counts = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const empty = Number.POSITIVE_INFINITY;

            if (input[i]![j]! !== "@") {
                counts[i]![j]! = empty;
                continue;
            }

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const di = i + dx;
                    const dj = j + dy;

                    const isMe = dx === 0 && dy === 0;
                    const isTooTall = di < 0 || di >= rows;
                    const isTooWide = dj < 0 || dj >= cols;
                    const isEmpty = !isMe && counts[di]?.[dj] === empty;

                    if (isTooTall || isTooWide || isMe || isEmpty) {
                        continue;
                    } else {
                        counts[di]![dj]!++;
                    }
                }
            }
        }
    }

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (counts[i]![j]! < 4) {
                total++;
                input[i]![j]! = ".";
            }
        }
    }
} while (total !== lastTotal);

console.log(total);
