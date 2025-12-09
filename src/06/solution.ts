const raw = `
123 328  51 64
 45 64  387 23
  6 98  215 314
*   +   *   +
`;

const data = raw
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/));

const rows = data.length;
const cols = data[0]!.length;
const ops = data[rows - 1] as Array<"*" | "+">;

let total = 0;

for (let j = 0; j < cols; j++) {
    let local = ops[j] === "*" ? 1 : 0;
    for (let i = 0; i < rows - 1; i++) {
        const num = Number(data[i]![j]);
        if (ops[j] === "*") {
            local *= num;
        } else {
            local += num;
        }
    }

    total += local;
}

console.log(total);
