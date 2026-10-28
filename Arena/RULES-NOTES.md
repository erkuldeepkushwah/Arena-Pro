# Arena Pro — Realtime Database rules

`database.rules.json` lives next to this file. It is **not** deployed by the Pages
workflow — rules live in Firebase, not in the repo.

## Applying them

1. **Copy the current rules first.** Firebase Console → Realtime Database → Rules.
2. Open the **Rules Playground** on the same screen and try a couple of paths.
3. Paste `database.rules.json` and **Publish**.

Or, with the CLI (add `{ "database": { "rules": "database.rules.json" } }` to a
`firebase.json` in `Arena/`):

```bash
firebase deploy --only database
```

---

## What the rules allow

| Node | Read | Write |
|---|---|---|
| `users` | admin only (collection) | — |
| `users/{uid}` | owner or admin | owner or admin |
| `products`, `welfareProducts` | signed-in | admin |
| `cricketMatches`, `tournaments` | signed-in | admin |
| `earnTasks`, `topPromotions` | signed-in | admin |
| `global/quizConfig`, `global/siteConfig` | signed-in | admin |
| `withdrawalRequests`, `rechargeRequests` | admin (collection) | — |
| `withdrawalRequests/{uid}/{id}` | that user only | create by that user, edit by admin |
| `rechargeRequests/{uid}/{id}` | that user only | create by that user, edit by admin |
| `referralIndex/{CODE}` | signed-in | claim your own code |
| `referrals/{referrerUid}/{newUid}` | that referrer or admin | the new user records themselves |

Concretely this stops:

- **anyone rewriting the shop** — entry fees, prize pools, daily income, quiz
  answer key and banners were all client-writable;
- **anyone editing someone else's wallet** — `users/{uid}` is owner-or-admin;
- **a user approving their own payout** — a request can be created but not edited
  by its owner, and `status` is limited to `pending` / `approved` / `rejected`;
- **a user awarding themselves a weekly prize** — `weeklyWinner*` carries an
  admin-only `.validate`;
- **reading other players' data** — the collection reads are admin-only, and the
  requests collection is nested per user so a player fetches only their own
  subtree.

Every leaf validation begins with `!newData.exists() || …` so that deleting a
record still validates — without it the admin's *Delete user* button fails.

---

## What changed in the data model to make this possible

| Before | Now |
|---|---|
| `withdrawalRequests/{pushId}` | `withdrawalRequests/{uid}/{pushId}` |
| `rechargeRequests/{pushId}` | `rechargeRequests/{uid}/{pushId}` |
| `SalesRecord` read all of `users` and filtered by `referredBy` | reads `referrals/{myUid}`, written at sign-up |
| referral codes had no index | `referralIndex/{CODE} → uid`, published on sign-in |

The code changes that go with it are in the same commit: `useFirebaseData`
gained `useMyWithdrawalRequests` / `useMyRechargeRequests` and flattens the
nested admin shape, `WithdrawScreen` / `PaymentFlow` push under the user's uid,
the two record screens use the "my" hooks, `AdminDashboard` addresses requests by
`{uid}/{id}`, and `SignUpScreen` records the referral link.

**Old data does not move itself.** If there are existing requests at the old flat
paths, either migrate them (`withdrawalRequests/{id}` → `withdrawalRequests/{uid}/{id}`)
or accept that the dashboard will stop showing them. Matches, products and users
are unaffected.

---

## Still open

**The wallet is client-authoritative.** `increment()` / `runTransaction()` removed
the accidental lost updates and double-spends, but a signed-in user can still set
their own `coins` and `balance` from the console — the rules restrict *whose*
wallet they can touch, not *what* they can write into their own. Making money
tamper-proof means moving every balance mutation server-side (Cloud Functions)
and removing client write access to `balance` and `coins` entirely. Worth doing
before this handles real money.

**The admin is a hardcoded email.** `auth.token.email === '125607@clorigo.com'`,
mirroring the check in `App.tsx`. Note the app signs people in as
`<number>@clorigo.com`, so every user's email ends in `@clorigo.com` — which is
why this compares the whole address. A custom claim (`auth.token.admin === true`)
would be better: rotating the admin then doesn't mean editing and redeploying
rules.

**`referrals/{referrerUid}/{newUid}` accepts any signed-in writer** as long as the
record's `uid` is their own. That is what makes self-registration work without a
server, but it does mean a determined user can attach themselves to any referrer.
The payout for a referral is still zero — `SalesRecord` shows a join date, not a
bonus, because the old "5% Bonus" was only ever displayed and never paid.
