import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "compound-interest",
  title: "Compound interest",
  level: "beginner",
  topics: ["saving", "investing", "compounding"],
  summary:
    "Explain how compounding makes money grow on itself and why starting early matters more than starting big.",
  body: `Compound interest is what happens when the interest you earn starts earning interest of its own. In the first year it barely shows. Over ten or twenty years it becomes the biggest reason that people who started early end up with far more than people who started late, even when the late starters put in more money.

## Simple versus compound

With **simple interest**, you earn a set amount on your original money each year and nothing more. Put in $1,000 at 5% and you get $50 a year, every year.

With **compound interest**, the $50 you earned in year one gets added to the pile, so in year two you earn 5% on $1,050, which is $52.50. In year three you earn on $1,102.50. Each year the base gets a little bigger, so the growth gets a little faster. It is slow at first and then surprisingly quick.

The same idea works in reverse on debt. Interest charged on a balance you have not paid gets added to what you owe, and next month you are charged interest on that too. That is why a small unpaid balance can turn into a large one.

## Time matters most

The rate matters, and how much you put in matters, but the number of years matters more than most people expect. Doubling your time does much more than doubling your money.

## A worked example

Say two friends both earn 6% a year on their savings. The first starts at 20 and puts in $200 a month for ten years, then stops completely and leaves the money alone. Total contributed: $24,000. The second waits until 30, then puts in $200 a month for thirty years without missing one. Total contributed: $72,000.

At 60, the first friend has roughly $197,000. The second has roughly $201,000. The person who put in a third as much money ended up with almost the same result, because their money had an extra ten years to compound before the other person even started.

Run the same numbers at 3% instead of 6% and the first friend ends with about $69,000 and the second about $117,000. The early start still did a lot of work, but a lower rate over decades costs far more than most people expect. That is why fees matter so much on long-term money: a fee is simply a rate working against you.

## What this means for you

Starting small and early beats starting big and late, so a regular contribution now is worth more than a larger one you keep postponing. Compounding also works against you on unpaid debt, which is one more reason to clear high-interest balances first.`,
  quickCheck: [
    {
      question: "What is the difference between simple and compound interest?",
      answer:
        "Simple interest is earned only on the original amount each year, while compound interest is also earned on the interest already added, so the base keeps growing.",
    },
    {
      question: "In the example, why did the friend who contributed $24,000 end up close to the friend who contributed $72,000?",
      answer:
        "Their money had an extra ten years to compound before the second friend even started, and those early years did most of the work.",
    },
    {
      question: "How does compounding relate to fees on long-term investments?",
      answer:
        "A fee acts like a negative rate, and over decades even a small difference in rate changes the final amount enormously.",
    },
  ],
};

export default lesson;
