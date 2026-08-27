import type { Lesson } from "../types";

const lesson: Lesson = {
  id: "etfs-explained",
  title: "ETFs explained",
  level: "intermediate",
  topics: ["investing", "etfs", "markets"],
  readingMinutes: 4,
  summary:
    "Understand what an exchange-traded fund is, how it works, and what to check before deciding whether one fits your plan.",
  body: `An exchange-traded fund, or ETF, is a basket of investments that you can buy and sell on a share market in a single trade. You buy one unit of the fund, and that unit is a small slice of everything the fund holds, which might be hundreds of companies or a collection of bonds.

## How an ETF works

Most ETFs are **index funds**: they hold whatever is on a published list, such as the largest companies on a particular market, in the same proportions, with no attempt to pick winners. That is what keeps costs low.

Each unit trades on the exchange like a share, but its value is set by the things it holds: when the companies inside rise, the unit rises, and when they fall, it falls.

People use them because one unit spreads money across an entire market, index funds are cheap to run, and you can look up exactly what a fund holds on any day.

## What to check before considering one

Every ETF has a **management fee**, a yearly percentage taken out of the fund's value, and a **spread**, the small gap between its buying and selling price, and you pay **brokerage** each time you trade.

Look at what the fund actually holds, because two ETFs with similar names can track very different lists: one country or many, one industry or all of them, growth or income. And read the product disclosure statement, the document every fund must publish describing what it does and what it charges.

## A worked example

Say you invest $2,000 in an ETF with a 0.10% yearly fee, and another $2,000 in one with a 1.00% fee. If both grow at 7% a year before fees for 20 years, the first ends up at about $7,590 and the second at about $6,410. Same market, same starting money, but nearly $1,200 of difference from fees alone.

## What ETFs are not

They are not risk-free. An ETF that tracks a share market falls when that market falls. Some are narrow, use borrowing to amplify returns, or track volatile things, and carry far more risk than a broad index fund. The word ETF tells you the wrapper, not what is inside it.

## What this means for you

An ETF is a low-cost way to own a slice of a whole market in one purchase, but it is only as sensible as what it holds. Read what is inside, compare the fees, and match it to your own time horizon before deciding whether it fits.`,
  quickCheck: [
    {
      question: "What does an index ETF do differently from a fund that tries to pick winners?",
      answer:
        "It simply holds whatever is on a published list in the same proportions, with no attempt to choose, which keeps its costs low.",
    },
    {
      question: "What three costs does the lesson say every ETF investor pays?",
      answer: "A yearly management fee, the spread between buying and selling prices, and brokerage on each trade.",
    },
    {
      question: "Why does the lesson say the word ETF tells you the wrapper, not what is inside?",
      answer:
        "Because two ETFs can hold very different things, from a broad market to a single volatile niche, so the label alone says nothing about the risk.",
    },
  ],
};

export default lesson;
