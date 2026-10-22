# Live Debate Betting Platform – Product Overview

Oct 21, 2026 · @Marc

> Produktbeschreibung als Grundlage für v2, unverändert übernommen. Das eingebettete Lebenszyklus-Diagramm (5 Stufen, 1 Ausnahmepfad) fehlt hier; die vermutete Stufenfolge steht in [ARCHITEKTUR.md](ARCHITEKTUR.md).

## Summary

A website and phone app where viewers bet on the outcome of live debates, decided by a preset jury. It launches in the US only and builds on an existing US patent.

The app links to a live stream (Twitch, YouTube) or a text debate on X. While the debate runs, it builds a live protocol, fact-checks claims about events and shows outside reactions. Jurors deliver a verdict on a slider, and bets settle on where the slider lands.

| Role | What they do |
| --- | --- |
| Viewer | Watches, chats, asks the AI, bets on the main market and point bets, votes in the People's Verdict |
| Juror | Judges in a separate room on preset criteria; can't bet |
| Host | The person who sets up the debate: picks the topic, ruleset template, debaters and jurors, and approves point bets. Not a participant in the debate |
| Moderator | Moderates the public chat and has additional rights/actions he can take |
| Debate moderator | Leads the actual debate, if it has one. Part of the debate, not the platform; their fairness is rated by the moderator bias check |

## How a debate works

A debate moves through five stages, from setup to settlement, with one exception path for no-shows and walkouts.

*[embedded content: debate lifecycle · 5 stages, 1 exception path]*

The ruleset locks when betting opens in stage 2. Money moves in stage 5, or as refunds through the exception path.

## Core features

Every feature below works without real money, which is what makes the free Phase 1 launch possible.

| Feature | What it does |
| --- | --- |
| Stream and thread linking | Embeds a Twitch or YouTube stream, or an X thread, next to the betting panel. Betting runs on the platform's own site and app, not inside Twitch. |
| Live protocol | Transcribes the debate as it happens, split by speaker, with each claim as its own item and timestamp. |
| Fact-checks (events only) | Checks only claims about events and quotes. Opinions, cause-and-effect claims and predictions are labeled "Opinion – not checked". Statuses: Confirmed, Contradicted by records, Unverified. |
| AI assistant | Viewers ask questions and get background information during the debate. |
| Public chat | Live chat for viewers, run by moderators. |
| Juror room | A separate space where jurors see the protocol and an AI assistant, but not the chat or the odds. |
| Spotlight | Shows posts about the debate from notable people on X and other sites, with an AI summary and the side it leans toward, labeled as an AI reading. |
| Community notes | Shows X Community Notes on cited posts. Viewers can write their own notes on event claims, with a linked source; notes appear only when rated helpful across both sides. |
| Speaker profiles | AI-built profiles from sources: self-description, positions over time, how others describe them, past debates, recurring arguments, platform record. |
| Anonymizer | Hides identities where needed: blind jury mode, anonymous jurors, private individuals in spotlight and profiles. |
| Moderator bias check | Rates how fairly the debate's own moderator treats each side. AI measures speaking time, interruptions and follow-up questions per side, and viewers can rate fairness too. Shown as a bias indicator; separate from the platform's chat moderators. |
| Watch-along streams | Links livestreams of other people discussing the debate while it runs, so viewers can switch to a commentator they like. Co-streamers bring their own audiences to the platform. In closed-evidence debates, their commentary reaches the audience only, never the jurors. |

Profiles follow four rules: every line is sourced, the speaker's own words come before AI interpretation, everyone gets the same template, and speakers have a right of reply. Profiles get human review before any real-money debate.

## Betting

The main market settles on the jury's slider rather than a yes/no winner, so close debates pay out close to 50/50.

**Main market.** Each debate has A shares and B shares priced from 0 to 100. If the jury slider ends at 70 toward A, A shares pay 70 and B shares pay 30. During the stream, one bar shows where the market stands; after the verdict, the jury's position appears on the same bar.

**Point bets.** Side bets on specific moments, run as pools: everyone stakes on yes or no, winners split the pot and the platform takes a fee.

| Type | Example |
| --- | --- |
| Mention | A brings up the 2008 crisis |
| Timing | …before minute 30 |
| Concession | B admits any point to A |
| Fact-check | Any claim by A rated "Contradicted" (open-evidence debates only) |
| Spotlight | A named expert posts about the debate |

Each point bet has a short definition with examples of what counts, locked when it opens. The AI flags the moment in the protocol, and a human resolver confirms borderline cases. A point bet closes the instant the AI detects the point; bets placed in the stream-delay window are voided. The AI suggests point bets from the debaters' past statements, and the host approves which go live.

**People's Verdict.** A viewer poll shown next to the Jury Verdict. It stays separate by default, because bettors vote for their own side and fanbases can flood it.

**Challenge pots (optional).** Viewers pay into a pot the debater earns for addressing a point. It works like a tip, so it may be possible where betting is not.

## Jury system

A preset jury of several jurors decides every debate, and the median of their sliders is the verdict.

- Jurors judge on criteria locked in the ruleset before betting opens.
- They work in a separate juror room with the protocol and an AI assistant. They don't see the public chat or the odds.
- Votes are sealed and revealed at the same moment, so jurors can't follow each other.
- The median, not the average, means one rogue juror can't swing the result.
- Jurors can't bet. They are paid from the platform fee and build a reputation score.
- Jurors stay anonymous to the public.
- Blind jury mode gives jurors an anonymized protocol, without names, voices or follower counts.
- The AI advises jurors but never decides a payout.
- The evidence rule sets what jurors may consider: only what was said (closed), or fact-checks and notes too (open).

Who selects the jurors is still open.

## Debate ruleset

Every debate runs on a ruleset picked from a template and locked when betting opens, so bettors see the exact rules before they put money in.

| Setting | Options |
| --- | --- |
| Topic | Fixed topic / open format (exception) |
| Outcome | Slider / binary |
| Verdict | Median of N jurors |
| Crowd poll | Separate / blended at a capped weight |
| Evidence | Closed (only what is said) / open (fact-checks and notes count) |
| Community notes | Off / audience only / counts as evidence |
| Spotlight | Off / audience only / jurors too |
| Juror view | Blind to odds and chat |
| Blind jury | Anonymized protocol on / off |
| Point bets | Off / preset only / AI-suggested and host-approved |
| No-show / walkout | Refund and deposit forfeited · walkout cutoff minute · reconnect grace period |

In closed-evidence debates, spotlight posts and community notes reach the audience only, never the jurors.

## Integrity and edge cases

The biggest risks come from people who can influence an outcome they profit from; each has a countermeasure built into the rules.

| Risk | Countermeasure |
| --- | --- |
| Debater throws the debate | Debaters and their teams can't bet against themselves; stake caps; flags on suspicious betting patterns |
| Debater forces a point bet | Debaters and teams are barred from point bets; low caps on point bets |
| Juror bribery or pressure | Several jurors from a vetted pool, sealed votes, median verdict, anonymous to the public, can't bet |
| Late bets during stream delay | Point bets close on AI detection; bets in the delay window are voided |
| Big account moves the odds with a post | Spotlight posts are timestamped; spotlighted people with open positions are flagged |
| Fans flood the crowd poll | People's Verdict kept separate, or capped weight with minimums such as account age or watch time |
| Biased note ratings | Raters with an open bet on the debate can't rate notes on it |
| AI fact-check is wrong | Shown to everyone at once with sources and status; advisory only, never decides payouts |
| Debater doesn't show up | Main bets refunded and show-up deposit forfeited; bets stay open if rescheduled within a postponement window (e.g., 48 hours) |
| Debater walks out | Before a cutoff (e.g., 15 minutes): refund. After it: jury rules on what was said, or forfeit, per ruleset. Resolved point bets stand; open ones are refunded |
| Stream crash or lost connection | Reconnect grace period before walkout rules apply |

Debater profiles show a show-up rate, so repeated no-shows make a debater hard to book.

## Business model and growth

The product launches in two phases: first as a free debate tool with points, then with real money in permitted states.

**Phase 1 – no real money**

- Offer the debate engine to streamers, podcasters and debate channels: live protocol, fact-check overlay, juror AI assistant.
- Points-based betting, a model viewers already know from Twitch Predictions.
- Streamers bring their audiences, which solves getting the first users.

**Phase 2 – real money in permitted states**

- A fee on each pool and on the main market.
- A revenue share for creators, so they promote the platform.
- Premium subscriptions.
- Sponsored debates.
- Challenge pots.

**Growth loops**

- Spotlighted people get notified and share the debate with their followers.
- Spotlighted people can be invited as guest jurors or callers.
- Verdict moments make shareable clips.
- Debater records and profiles build up, so every new debate draws on earlier ones.

## Legal and compliance (US)

Real-money betting is regulated state by state, so a US gaming lawyer comes before Phase 2. This section is a checklist, not legal advice.

- **Gambling law:** geofencing to permitted states and identity checks (KYC). Test with the lawyer whether debates can count as skill contests, since the debaters' performance decides the outcome.
- **Platform rules:** Twitch restricts real-money transactions in extensions, so betting runs on the platform's own site and app. Check each platform's embed terms for gambling-adjacent use.
- **Defamation:** public figures must prove actual malice, but publishing unchecked AI output could look reckless. Every profile line is sourced, and profiles get human review before real-money debates.
- **AI output:** Section 230 protects platforms for user content such as chat, but likely not for AI-generated profiles and fact-checks. Treat them as the platform's own speech.
- **Right of publicity:** debaters sign a participation agreement that includes marketing consent. Everyone else stays purely informational and never appears in ads.
- **Privacy:** profiles use public figures' public statements; private individuals are anonymized.
- **X data:** check X's terms before commercial reuse of Community Notes data. X API access is billed per use, so spotlight costs grow with the number of posts read.
- **Content policy:** almost all political speech is legal in the US, so who may debate is a business decision. App stores, payment processors and advertisers set the practical limits.
- **Patent:** compare the patent's claims with existing apps that already combine escrow with a designated judge.
