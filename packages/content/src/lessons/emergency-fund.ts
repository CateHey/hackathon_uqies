import type { AuthoredLesson } from "../types";

const lesson: AuthoredLesson = {
  id: "emergency-fund",
  title: "Your emergency buffer",
  level: "beginner",
  topics: ["saving", "security", "emergency fund"],
  summary:
    "Work out how big your emergency buffer needs to be and build it a little at a time without it feeling impossible.",
  body: `An emergency buffer is money you set aside and do not touch unless something goes wrong. The car needs a repair, your hours get cut, your laptop dies the week before an assignment is due. Without a buffer, these moments turn into debt or a scramble to borrow. With one, they are just an annoying week.

## Why it comes first

It is tempting to skip straight to investing or saving for something exciting. But a buffer is what protects those other goals. If a $900 dental bill lands and you have nothing set aside, the money comes from your trip savings, your credit card, or a loan with interest. A buffer means a bad month does not undo six good ones. It also changes how you feel: knowing you can cover a surprise makes it easier to turn down a shift, negotiate a bill, or leave a job that is not working out.

## How big should it be?

There is no single right number. A common starting point is one month of your essential costs: rent, food, transport, phone, and minimum payments on any debt. Not your whole income, just what keeps the lights on. Once you have that, many people aim for three months, and more if their income is irregular or they support someone else. Start smaller if a month feels out of reach. Even $500 covers most of the surprises that would otherwise go on a card.

## A worked example

Say your essentials come to $1,500 a month: $850 rent, $350 food, $150 transport, $150 for phone and bills. One month of buffer is $1,500. Three months is $4,500.

Putting aside $150 a fortnight gets you to $1,500 in about five months, and to $4,500 in roughly fourteen. If that is too much right now, $75 a fortnight still reaches the first milestone within a year. The speed matters less than the habit, because a transfer that happens automatically on payday is one you never have to decide about.

## Where to keep it

The buffer needs to be easy to reach within a day or two, separate from your everyday spending so you do not drift into it, and not exposed to swings in value. A separate savings account that you can see but do not use day to day is what most people choose. Whether it earns much interest matters less than whether it is there when you need it.

## What this means for you

Work out your essential monthly costs and make one month of them your first target. Set up an automatic transfer on payday, even a small one, and let the balance build without you having to think about it.`,
  quickCheck: [
    {
      question: "What costs should you include when working out the size of your emergency buffer?",
      answer:
        "Only your essentials, such as rent, food, transport, phone and minimum debt payments, not your whole income.",
    },
    {
      question: "Why does the lesson suggest building a buffer before investing or saving for fun goals?",
      answer:
        "Because a buffer protects those other goals; without it, a surprise bill gets paid from your savings or with borrowed money.",
    },
    {
      question: "What three features does a good place to keep your buffer have?",
      answer: "It is quick to access, kept separate from everyday spending, and not exposed to swings in value.",
    },
  ],
};

export default lesson;
