import type { Lesson } from "../types";

const lesson: Lesson = {
  id: "what-is-investing",
  title: "What is investing?",
  level: "beginner",
  topics: ["investing", "markets"],
  readingMinutes: 4,
  summary:
    "Describe what investing actually is, how it differs from saving, and what the main types of investment do.",
  body: `Investing means putting your money into something you expect to grow in value or pay you an income over time, in exchange for accepting that it might not. Saving keeps money where it stays put; investing puts it to work, and work involves some uncertainty.

## Saving and investing do different jobs

Savings are for money you will need soon or cannot afford to lose: your buffer, next semester's fees, the bond on a rental. It does not go backwards and is quick to reach.

Investing is for money you can leave alone for years. Over long stretches investments have historically outgrown savings accounts, but along the way they rise and fall, sometimes sharply. If you might need the money soon, a dip at the wrong moment could force you to sell at a loss.

## The main kinds of investment

**Shares** are small pieces of ownership in a company. If it does well, the share can rise and may pay out part of its profits as dividends; if it does badly, the share can fall.

**Bonds** are loans you make to a government or a company. They pay regular interest and return your money at the end, and are usually steadier than shares but grow more slowly.

**Property** can rise in value and earn rent, but comes with large costs and cannot be sold quickly.

**Funds** pool money from many people and spread it across lots of shares or bonds, so one purchase gives you a slice of hundreds of companies.

Your superannuation is already an investment: every employer contribution is invested in a mix of these things on your behalf.

## A worked example

Say you have $3,000 that you will not need for at least five years. Left in a savings account earning 4%, it would be worth about $3,650 after five years. Invested in a broad mix of shares that averaged 7% a year, it would be about $4,200.

But "averaged" is doing a lot of work in that sentence. In one of those years the value might have dropped to $2,500, and in another jumped by 20%. The higher result only shows up if you leave it alone through the rough patches.

## What this means for you

Investing is a tool for money you can leave alone for years, not a shortcut to getting rich or a place for your emergency buffer. Let your time horizon decide whether saving or investing is the right job for each dollar, and understand what you would own before any money moves.`,
  quickCheck: [
    {
      question: "What is the main difference between saving and investing?",
      answer:
        "Saving keeps money put where it does not go backwards and is quick to access, while investing puts money to work for growth and accepts that its value can fall along the way.",
    },
    {
      question: "What is a bond, in plain terms?",
      answer: "A loan you make to a government or company that pays you regular interest and returns your money at the end.",
    },
    {
      question: "Why does the lesson say the word 'averaged' is doing a lot of work in the example?",
      answer:
        "Because an average of 7% a year hides big swings in individual years, and the higher result only arrives if you stay invested through the falls.",
    },
  ],
};

export default lesson;
