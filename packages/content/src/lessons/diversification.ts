import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "diversification",
  title: "Diversification",
  level: "intermediate",
  topics: ["investing", "risk", "diversification"],
  summary:
    "Explain how spreading your money across different investments limits the damage any single one can do.",
  body: `Diversification means not putting all your money in one place. It is the closest thing investing has to a free lunch: spreading your money across many investments lowers how much any single bad outcome can hurt, without giving up much in long-term returns.

## Why one thing is dangerous

Any single company can fail. Any single industry can have a terrible decade. Any single country's economy can stall. If all your money is in one of those, its fate becomes your fate. Spread across hundreds of companies, the same failures still happen, but each is a small dent rather than a crater.

## The layers of spreading out

**Across companies:** many businesses rather than one, so a single collapse does not wipe you out.

**Across industries:** technology, healthcare, banking, mining and retail all have different good and bad years.

**Across countries:** the Australian share market is small on the world stage and heavy in banks and mining, so holding only local shares means leaning hard on two industries.

**Across asset types:** shares, bonds, property and cash behave differently, and when shares fall bonds often hold steady.

A pooled fund does much of this in one purchase, and your superannuation already works this way by default.

## A worked example

Say you have $10,000 invested. In the first version, all of it is in a single company's shares. The company loses a major contract and its share price halves. You now have $5,000.

In the second version, the same $10,000 is spread across 200 companies, and that company is one of them at $50. When it halves, you lose $25. Meanwhile the other 199 companies had an ordinary year and grew by 6% on average, so your total went from $10,000 to roughly $10,570. The disaster was real; it just was not yours.

## What diversification cannot do

It does not stop the whole market from falling together. In a broad downturn most shares drop at once, and spreading across asset types softens this but does not remove it. Diversification protects you from the bad luck of one investment, not from the bad years everyone shares.

Nor is it about owning as many things as possible. Twenty funds that all hold the same companies are not diversified; they are the same bet with extra fees.

## What this means for you

Before you put money into anything, ask what happens to the rest of your money if this one thing goes badly. If the answer is "not much" you are diversified, and if the answer is "everything" you are not, no matter how good the idea sounds.`,
  quickCheck: [
    {
      question: "What are the four levels at which you can diversify?",
      answer: "Across companies, across industries, across countries, and across asset types such as shares, bonds, property and cash.",
    },
    {
      question: "What is the one thing diversification cannot protect you from?",
      answer:
        "A broad market downturn where most investments fall together; it protects against the bad luck of one holding, not the bad years everyone shares.",
    },
    {
      question: "Why are twenty funds that hold the same companies not diversified?",
      answer: "Because they are the same bet repeated, with extra fees on top, rather than exposure to genuinely different things.",
    },
  ],
};

export default lesson;
