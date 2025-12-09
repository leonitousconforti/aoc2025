const raw = `
3-5
10-14
16-20
12-18

1
5
8
11
17
32
`;

const [ranges] = raw.split("\n\n");

if (!ranges) {
    throw new Error("Invalid input format");
}

const sum = ranges
    .trim()
    .split("\n")
    .map((line) => {
        const [start, end] = line.split("-").map(Number);
        return { start: start ?? 0, end: end ?? 0 };
    })
    .sort((a, b) => a.start - b.start)
    .reduce<{ start: number; end: number }[]>((acc, curr) => {
        const last = acc[acc.length - 1];
        if (last && curr.start <= last.end) {
            last.end = Math.max(last.end, curr.end);
        } else {
            acc.push(curr);
        }
        return acc;
    }, [])
    .reduce((acc, cur) => acc + (cur.end - cur.start + 1), 0);

console.log(sum);
