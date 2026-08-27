import type { Lesson } from "../types";

const lesson: Lesson = {
  id: "budgeting-basics",
  title: "Budgeting basics",
  level: "beginner",
  topics: ["budgeting", "spending"],
  readingMinutes: 4,
  summary:
    "Build a simple monthly budget that shows where your money goes and makes room for the things you actually want.",
  body: `A budget is not a punishment. It is a plan for your money that you write down before the month starts, so you decide where it goes instead of finding out afterwards. Once you can see where it goes, the choices get much easier.

## Start with what comes in

Write down everything you can reliably expect in a typical month: wages, government payments, money from family, a side hustle. Use the amount that actually lands in your account after tax. If your hours change week to week, use a figure from a quieter month; it is better to be pleasantly surprised than caught short.

## Sort what goes out

Now list your spending in three groups. **Fixed costs** are the same every month and hard to change quickly: rent, phone plan, transport, subscriptions. **Flexible costs** are things you need but can adjust: groceries, fuel, eating out. **Goals** are money you set aside on purpose: a buffer for surprises, a trip, a laptop.

If you are not sure what you spend, look back over two months of bank transactions and sort each one into a group. It can feel uncomfortable, but you are gathering information, not judging yourself.

## A worked example

Say you earn $2,400 a month from a part-time job. Fixed costs are $1,100: $800 rent, $60 phone, $40 streaming, $200 for transport and small bills. Flexible spending has been running at $900: $400 groceries, $350 eating out and drinks, $150 on clothes and extras. That leaves $400 for goals.

You want a $6,000 trip in eighteen months, which needs about $335 a month. So you trim eating out to $250 and clothes to $100. Now you have $550 for goals: $335 for the trip and $215 for a buffer. Nothing dramatic changed, but the trip went from "maybe one day" to a specific date.

## Make it stick

A budget only works if you check in with it. Each week, spend five minutes comparing the plan with what actually happened, and adjust. If a category keeps blowing out, the fix is usually to change the plan, not to try harder. And leave some money that is just for fun, because a budget with no breathing room gets abandoned fast.

## What this means for you

You do not need a perfect budget, just an honest one that you look at regularly. Start with real numbers from the last two months, put your goals in as a line item, and treat every overspend as information rather than failure.`,
  quickCheck: [
    {
      question: "What are the three groups this lesson suggests sorting your spending into?",
      answer:
        "Fixed costs (the same every month and hard to change), flexible costs (needed but adjustable), and goals (money you set aside on purpose).",
    },
    {
      question: "If your income changes from week to week, which figure should you build your budget on?",
      answer: "A figure from a quieter month, so the plan still works when a good fortnight does not repeat.",
    },
    {
      question: "In the worked example, how did the $6,000 trip become affordable without cutting fixed costs?",
      answer:
        "By trimming two flexible categories (eating out and clothes) by $150 in total, which lifted the goals amount from $400 to $550 a month.",
    },
  ],
};

export default lesson;
