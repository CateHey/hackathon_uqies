import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "understanding-risk",
  title: "Understanding risk",
  level: "beginner",
  topics: ["risk", "investing", "volatility"],
  summary:
    "Recognise the different kinds of risk in investing and work out how much you can actually live with.",
  body: `Risk, in money terms, is the chance that things do not go the way you planned. Cash in a savings account is safe from market falls but slowly loses buying power to inflation, while shares can grow well over decades but can drop sharply in a week. There is no option with zero risk, only different kinds to choose between.

## Volatility is not the only risk

**Volatility** is how much an investment's value swings over time, and it gets the most attention because it is visible: you log in and the number has dropped.

But there are quieter risks too. **Inflation risk** is your money buying less each year. **Liquidity risk** is not being able to get your money out when you need it, as with property. **Concentration risk** is having too much riding on one thing. Being safe from one kind of risk often means taking on more of another.

## Risk and return travel together

Investments that could grow faster are the ones that could also fall further. Nobody would accept the chance of losing a quarter of their money unless they were also offered the chance of gaining more than a savings account pays. If something promises high returns with no chance of loss, that mismatch is the warning sign, not the opportunity.

## A worked example

Say you have $5,000 in a broad mix of shares, and the market has a bad year and drops 25%. Your balance is now $3,750. If you sell, that loss is locked in. If you leave it, the holding might climb back to $5,000 and beyond, but recoveries have sometimes taken years.

Now imagine that $5,000 was your rent money for the next three months. The drop is not a bumpy patch; it is a crisis. Same investment, same fall, completely different risk, because the risk was in the mismatch between the money and what you needed it for.

So ask two questions about any money you invest: could you afford the loss without it changing your life, and could you sit through it without selling in a panic? If either answer is no, that money is carrying more risk than it should.

## What this means for you

Match the risk you take to when you need the money and how you would react to a fall, not to what someone else is doing. Money you need in the next couple of years belongs somewhere steady, and money you can leave alone for many years can afford to ride out the swings.`,
  quickCheck: [
    {
      question: "Name two kinds of risk other than volatility that the lesson describes.",
      answer:
        "Any two of inflation risk (money buying less over time), liquidity risk (not being able to get money out when needed) and concentration risk (too much riding on one thing).",
    },
    {
      question: "Why do higher potential returns come with higher risk?",
      answer:
        "Because nobody would accept the chance of a large loss unless they were also offered the chance of a larger gain; the two are the same trade seen from both sides.",
    },
    {
      question: "In the example, what changed the same 25% fall from a bumpy patch into a crisis?",
      answer:
        "Whether the money was needed soon: the risk was in the mismatch between the investment and what the money was for, not just in the investment itself.",
    },
  ],
};

export default lesson;
