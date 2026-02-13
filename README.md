# Petro Online
A fresh start for Petro! A better code architecture, an actual battle mode and more features to come. As always, WIP

# Heads Up!

**AI written Code wont be accepted in a PR!** It isnt worth trying to submit a Vibe coded PR. It wont be accepted.
<br>
If youre trying to just copy a ToDo and throw it into a Prompt, it is likely to get the PR rejected. Please write your own code, that you understand.

## Quick Infos

> These Credentials are used to Log in to the Static Placeholder Accounts for testing.

**Player1** Login:
<br>
IGN: `p1`
<br>
PW: `PW_P1`

**Player2** Login:
<br>
IGN: `p2`
<br>
PW: `PW_P2`

## Focus
To keep things organized and structured, the focus lies on creating the Main Ingame Logic first, with Placeholders:

- for Player Accounts
- Pets assigned to the Static Accounts
- Money assigned to the Static Accounts

The Main Ingame Logic is explained further beneath the ToDos Section, but here is a quick overview, for the most important concepts that need to be built first.

`Matchmaking (1v1)` > `Pregame Logic` > `Ingame Logic` > `Postgame Logic`

`Other` Cases

### Matchmaking

**Cant Start** when: user has less than 3 pets

`Play` button on homepage > Matchmaking screen > User in queue > queue logic (2 players per match) > _pregame_ screen

### Pregame

**Bets** $0 - `players max balance`

**Pets** Select Three Pets (from Inventory)

**Specials** 3 Slots for `Spells` and `Jokers` (from Inventory). Can be emtpy selection

**Countdown**

### Ingame

Most complicated Part. Turn based Game.

On each Turn, Player can utilize a Pet and choose to activate a Spell or Joker. Each Pet can either `defend an attack` or `attack`. When defening, damage from the opponent gets observed. When attacking, damage is dealed to the opponent. If opponent attacks after been attacked, damage is observed by the pet with the most health


Pets can have different Damage Options and Defend Options. Some can defend fire damage but can only deal long range damage.

Some deal fire damage, and can defend many types of damage.

Look below for a detailed explanation.

You Loose when all your Pets are dead. You Win if your opponent dies.

### Postgame

####  When won:

Rewards!

**Money** is calculated from remaining HP of all Pets

> Money = HP * 0.1

You also get one random **Special** from your opponent, which can either be a Joker or Spell

And **+6 Money** added, regardless how much HP you had left on your Pets

==> Return to Home, clean up Game process

#### When lost:

**+2 Money**

### Others

**One/Both Player leaves** > cleanup process, return remaining player to home

**Passive Income** > `+1 Money` each 5 Mins if user is online (on website)


# Contribution

Basic Infos for your convenience, so you know what to do, if you want to help working on this Project


**Info** Graphic doesnt matter! Focus lies on the logic behind it, not how it looks.

## Commit Schema

> Please follow this basic and known commit schema, to make things easier to read for all of us

- `feat:` for added features in a commit
- `fix:` for fixes of something
- `docs:` for updated documentation, such as the README, added .md files, or comments in your code
- `removed:` for removed features, or old code snippets you removed in that commit
- `logic:` for any added logic, like databases, ect. which arent traditional features for users

## ToDo's

ToDo's on the Top are more important than ToDo's at the bottom. Please work on unsolved ToDo's at the Top. 

**If you want to work on a ToDo**, open a PR first, and mark it as `"Draft"` and then start coding.

Before you choose a ToDo to work on, please **check the PRs first**, to see if someone is already working on that ToDo. If thats the case, ask them to collaborate or choose another ToDo.

> Open a new PR in a _seperate branch_ for each ToDo

- [ ] Init
- [ ] Matchmaking
- [ ] Pregame
- [ ] Connect to [CNS Auth](https://github.com/cns-studios/auth)
- [ ] Balanced Pets (Upload a `pets.csv`)
- [ ] ...

---

### Pets Explaination

**Example Pets!**

**If** Tiger attacks Bird, and Bird would try to defend, it cant, because doesnt have the "Defense Shortrange" ability and would die, because the attack (8 HP) oneshots the entire Health of the Bird.

> These are exampe Pets, and are unbalanced. 

| Pets  | Skills | Damage                            | Defense              | HP | Rank      |
|-------|--------|-----------------------------------|----------------------|----|-----------|
| Bird  | Range  | Longrange=5, Suprise Attack= 2    | Spread=4             | 7  | Common    |
| Tiger | Close  | Shortrange=8                      | Normal=10, Midrange=5| 9  | Legendary |

### Project Plan

[View in Browser](https://i.imgur.com/EXiKq3r.png)

![alt text](https://i.imgur.com/EXiKq3r.png)