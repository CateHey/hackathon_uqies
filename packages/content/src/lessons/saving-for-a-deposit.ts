import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "saving-for-a-deposit",
  title: "Saving for a home deposit",
  level: "intermediate",
  topics: ["property", "saving", "deposit"],
  summary:
    "Turn a home deposit into a real number and an honest timeline, and know where the money should sit while you build it.",
  body: `A home deposit is the part of the purchase price you pay upfront, with a lender covering the rest through a mortgage. It is usually the largest sum most people ever save, and it feels impossible until you break it into a monthly number and a date.

## How much is a deposit?

Lenders typically want 20% of the purchase price for their best terms. Smaller deposits, sometimes down to 5%, usually mean paying for lenders mortgage insurance, which protects the lender rather than you and can add thousands.

Then there are the extras people forget: stamp duty, a state tax on property purchases that is sometimes reduced for first home buyers, plus conveyancing, inspections and moving costs. Together these can add several percent on top.

## A worked example

Say you are aiming at a $600,000 apartment. A 20% deposit is $120,000. Add roughly $20,000 for stamp duty and $5,000 for other costs, and the real target is closer to $145,000. If you can save $1,500 a month, that takes about eight years before interest, or around seven if your savings earn 4% along the way.

A 10% deposit instead means $60,000 plus costs and perhaps $12,000 for lenders mortgage insurance: roughly $95,000, reached in a little over five years. You get there sooner but pay more for the privilege and carry a larger mortgage. Neither is right or wrong; they are different trade-offs.

## Where the money sits

Because you will need all of it on a specific day, most people keep the bulk somewhere steady, such as a savings account or term deposit, where the balance cannot fall. Money that has to be there in three years does not have time to recover from a market drop.

Automate the transfer on payday so the money is gone before you can spend it, and review the amount as your income changes.

There are also government schemes for first home buyers in Australia, including one that lets you save part of a deposit through superannuation and others that reduce the deposit needed. Their conditions change over time, so check the current rules on official government sites.

Finally, renting while you build the deposit is not failing; it is the plan.

## What this means for you

Turn the deposit into a real number including stamp duty and other costs, then divide it by what you can save each month to get an honest timeline. Keep the money somewhere it cannot fall, automate the transfer, and check the current first home buyer rules before you count on them.`,
  quickCheck: [
    {
      question: "What extra costs beyond the deposit itself does the lesson say to budget for?",
      answer:
        "Stamp duty, conveyancing, inspections and moving costs, plus lenders mortgage insurance if the deposit is under 20%.",
    },
    {
      question: "In the example, what is the trade-off between a 10% and a 20% deposit?",
      answer:
        "The 10% deposit is reached about three years sooner, but you pay for lenders mortgage insurance and take on a larger mortgage.",
    },
    {
      question: "Why does the lesson suggest keeping deposit savings somewhere the balance cannot fall?",
      answer:
        "Because you will need all of it on a specific day, and money needed within a few years does not have time to recover from a market drop.",
    },
  ],
};

export default lesson;
