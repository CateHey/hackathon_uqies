import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "understanding-debt",
  title: "Understanding debt",
  level: "beginner",
  topics: ["debt", "interest", "credit"],
  summary:
    "Tell the difference between debt that builds something and debt that just costs you, and know what to check before borrowing.",
  body: `Debt is borrowing money now and paying it back later, usually with extra on top, and that extra is interest. Debt is not automatically good or bad. What matters is what it costs, what you get for it, and whether you can comfortably pay it back.

## Interest is the real cost

When you borrow, the lender charges a percentage of what you owe, usually quoted as a yearly rate. A $2,000 loan at 20% a year costs about $400 in interest if you take a full year to repay it. The higher the rate and the longer you take, the more you pay. Two things to check on anything you borrow: the **interest rate** and the **fees**. Some products advertise no interest but charge account or late fees that add up to more.

## Not all debt is the same

Some debt helps you build something. A study loan such as HECS-HELP lets you get a qualification now and repay gradually through the tax system once you earn above a threshold. A home loan buys a place to live that may hold its value.

Other debt mostly costs you. Credit cards and buy-now-pay-later services are convenient, but their rates and late fees are high, and they are easiest to use for things that are gone by the time the bill arrives. The question to ask is: will this purchase still be worth something when I finish paying for it?

## A worked example

Say you have $1,200 on a credit card at 20% a year and pay only the minimum, often around $25 a month. At that pace you would take more than eight years to clear it and pay around $1,200 in interest, roughly doubling what you spent.

Pay $150 a month instead and the card is cleared in about nine months with around $100 of interest. Same debt, same rate, a very different bill, simply because you paid it down faster.

## Signs to watch for

Only ever paying the minimum. Using one card to pay another. Not knowing your total balance. These are signals to stop, list every debt with its rate and balance, and make a plan. Free financial counselling services exist in Australia for exactly this, and calling early is good judgement, not defeat.

## What this means for you

Before you borrow, know the rate, the fees, and what you are actually buying. If you already have debt, paying more than the minimum on the highest-rate balance is usually the fastest way to cut what it costs you.`,
  quickCheck: [
    {
      question: "What two things does the lesson say to check on anything you borrow?",
      answer:
        "The interest rate and the fees, because fees can cost more than interest even on a product advertised as interest-free.",
    },
    {
      question: "Why did paying $150 a month instead of the minimum make such a big difference in the example?",
      answer:
        "Interest is charged on the balance still owing, so clearing the $1,200 in nine months instead of eight-plus years cut the interest from around $1,200 to around $100.",
    },
    {
      question: "What single question does the lesson suggest asking before taking on debt for a purchase?",
      answer: "Will this purchase still be worth something when I finish paying for it?",
    },
  ],
};

export default lesson;
