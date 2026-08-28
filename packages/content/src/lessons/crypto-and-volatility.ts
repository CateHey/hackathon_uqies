import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "crypto-and-volatility",
  title: "Crypto and volatility",
  level: "intermediate",
  topics: ["digital assets", "crypto", "risk"],
  summary:
    "Understand what cryptocurrency is, why its price swings so much, and how to think clearly about the risk before any money is involved.",
  body: `Cryptocurrency is digital money that runs on a shared public ledger, called a blockchain, rather than through a bank. A network of computers around the world maintains the ledger and records who holds what, with no central organisation in charge. Some people see it as a genuine innovation and others as speculation; this lesson will not settle that argument.

## Why the price moves so much

Most things you can invest in have an anchor: a company has profits, a bond has interest payments, a property has rent. These give people a way to judge what something is worth, which keeps the price from drifting too far.

Most cryptocurrencies do not have that anchor. Their value rests on what the next person is willing to pay, which depends on sentiment, news, regulation and the mood of a market that never closes. Swings of 10% in a day and 50% in a few months have been common, and long declines have followed most peaks.

## Volatility cuts both ways

A price that can double quickly can also halve quickly. The stories you hear are mostly about the first kind. The maths is also unkind: a 50% fall needs a 100% rise just to get back to where you started.

There are risks beyond price too. Exchanges have collapsed and taken customers' money with them. Lost wallet passwords cannot be recovered by anyone. Scams promising steady crypto returns are common and often target younger people. And regulation is still changing.

## A worked example

Say you put $2,000 into a cryptocurrency that rises 60% over three months. Your holding is worth $3,200. Over the next six months it falls 55%. You now hold $1,440, which is $560 less than you started with, despite having been up by more than half.

Now imagine that $2,000 was set aside for a $6,000 trip. The trip is now further away than when you began. The same swings on money you could genuinely afford to lose would be a rough ride, not a setback. So before anything moves, ask whether you understand what this thing is, whether you could lose all of it without changing your plans, and whether anyone is promising returns, which signals a scam.

## What this means for you

Cryptocurrency is a high-volatility asset where large gains and large losses are both normal, so any money involved needs to be money you could lose entirely without harm. Whether to take part is your call, but make it with clear eyes, and be especially wary of anyone promising steady returns.`,
  quickCheck: [
    {
      question: "Why does the lesson say most cryptocurrencies are more volatile than shares or bonds?",
      answer:
        "They lack an anchor like profits, interest or rent that gives people a way to estimate value, so the price rests on what the next person will pay.",
    },
    {
      question: "In the example, how did a 60% rise followed by a 55% fall leave you behind?",
      answer:
        "$2,000 grew to $3,200, then fell to $1,440, because the 55% fall was taken off a larger amount than the 60% rise was added to.",
    },
    {
      question: "Name two risks in crypto that have nothing to do with the price moving.",
      answer:
        "Any two of exchange collapses, unrecoverable lost wallet passwords, scams promising steady returns, and changing regulation.",
    },
  ],
};

export default lesson;
