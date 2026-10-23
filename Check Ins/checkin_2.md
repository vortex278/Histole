# Check In 2: Normalization and Architectural Evolution

*Due November 1st*

## Purpose and scope

The first check-in described Histole as a guessing game backed by an event catalog. The
frontend now uses 29 in-memory events in `src/game/mock-events.ts`, including the five
original prototype events, while the backend seed catalog contains 60 events. The new
design supports:

- the historical event catalog and its reusable descriptive values;
- events with more than one tag, even though the current UI displays one tag;
- anonymous game sessions and the guesses made in each session; and
- integrity rules that prevent duplicate names, invalid category references, and
  duplicate attempts.

Accounts, authentication, and long-term player statistics remain future features. A
session can therefore be created without a user table. Adding a user later will not
require restructuring the event catalog.

## Schema evolution

The initial design placed one foreign key for each category directly on `Event`. That
works for the current prototype, but `tag_id` permits only one tag per event. It also
does not record which event was the target of a particular round or which guesses were
made. The expanded design keeps the reusable lookup tables and adds:

| New relation | Reason |
| --- | --- |
| `EventTag` | Resolves the many-to-many relationship between events and tags. |
| `GameSession` | Records a round's date, target event, and outcome. |
| `Guess` | Records each selected event and its attempt number within a round. |

The application can still show the first or primary tag in its current card-shaped
view. The database is no longer forced to discard additional tags.

## Normalization demonstration

To make each stage comparable, the following sample facts are used throughout:

| Event | Year | State | Era | Scale | Tag |
| --- | ---: | --- | --- | --- | --- |
| California Gold Rush | 1849 | California | National Expansion | International | Migration |
| Declaration of Independence | 1776 | Pennsylvania | American Revolution | International | Politics |
| Battle of Gettysburg | 1863 | Pennsylvania | Civil War | National | Military |
| Moon Landing | 1969 | Florida | Modern Era | International | Science |
| Louisiana Purchase | 1803 | Louisiana | New Nation | International | Expansion |

These values match the current prototype. The original UI represents one tag per
`EventCard`; the normalized schema below is prepared for adding another tag later.

### Starting relation: an unnormalized design

An early all-in-one design might have stored an event and all of its lookup
descriptions in one row:

`EVENT_RECORD(event_id, event_name, event_year, state_id, state_name, state_abbreviation, era_id, era_name, era_start_year, era_end_year, scale_id, scale_name, tag_id, tag_name, description, image_url)`

The original five-table design allowed one tag per event. The new schema preserves
that sample fact while making it possible to add more tags through `EventTag` later.
This is the unnormalized starting point, not the final schema.

### First Normal Form (1NF)

To reach 1NF, each field contains one value and each row describes one event:

`EVENT_1NF(event_id, event_name, event_year, state_id, state_name, state_abbreviation, era_id, era_name, era_start_year, era_end_year, scale_id, scale_name, tag_id, tag_name, description, image_url)`

| event_id | event_name | event_year | state_id | state_name | era_id | era_name | scale_id | scale_name | tag_id | tag_name |
| ---: | --- | ---: | ---: | --- | ---: | --- | ---: | --- | ---: | --- |
| 1 | California Gold Rush | 1849 | 1 | California | 4 | National Expansion | 5 | International | 1 | Migration |
| 2 | Declaration of Independence | 1776 | 2 | Pennsylvania | 2 | American Revolution | 5 | International | 2 | Politics |
| 3 | Battle of Gettysburg | 1863 | 2 | Pennsylvania | 5 | Civil War | 4 | National | 3 | Military |
| 4 | Moon Landing | 1969 | 3 | Florida | 10 | Modern Era | 5 | International | 4 | Science |
| 5 | Louisiana Purchase | 1803 | 4 | Louisiana | 3 | New Nation | 5 | International | 5 | Expansion |

Every value is atomic, so the relation is in 1NF. Because this version still has one
tag per event, `event_id` is a candidate key at this stage. The future many-to-many
extension changes the association's key to `(event_id, tag_id)` in `EventTag`.

### Second Normal Form (2NF)

The key of `EVENT_1NF` is `event_id`, so there are no partial dependencies: 1NF is
already in 2NF for this one-tag sample. This is an important intermediate result,
not a skipped step. The design still has repeated lookup facts and will need a 3NF
decomposition. If multiple tags were stored by repeating an event row, the natural
key would become `(event_id, tag_id)` and the following partial dependencies would
appear:

- `event_name`, `event_year`, `state_id`, `era_id`, `scale_id`, `description`, and
  `image_url` depend only on `event_id`;
- `tag_name` depends only on `tag_id`; and
- the association itself depends on both `event_id` and `tag_id`.

Those partial dependencies would violate 2NF. The planned many-to-many extension is
therefore represented as:

```text
EVENT_2NF(
  event_id PK, event_name, event_year, state_id, era_id, scale_id,
  description, image_url
)

TAG_2NF(tag_id PK, tag_name)

EVENT_TAG_2NF(
  event_id PK/FK, tag_id PK/FK
)
```

For the current sample, each event has one row in `EVENT_2NF` and one association
in `EVENT_TAG_2NF`. If an additional tag is added later, only another association
row is inserted; no event details are duplicated.

At this stage, every non-key attribute depends on the whole key of its relation.
However, `EVENT_2NF` still stores descriptions of referenced lookup values, such as
`state_name` and `scale_name`, if those columns are carried forward from the
all-in-one table. Those are transitive dependencies.

### Third Normal Form (3NF)

Remove the transitive dependencies by putting each reusable concept in its own
relation:

```text
STATE(state_id PK, state_name UK, abbreviation UK)
ERA(era_id PK, era_name UK, start_year, end_year)
SCALE(scale_id PK, scale_name UK, display_order UK)
TAG(tag_id PK, tag_name UK)
EVENT(
  event_id PK, event_name UK, event_year, state_id FK, era_id FK,
  scale_id FK, description, image_url
)
EVENT_TAG(event_id PK/FK, tag_id PK/FK)
```

For example, `state_id = 2` is stored once as Pennsylvania. Events 2 and 3 both
reference it, rather than repeating the spelling and abbreviation. `era_name`,
`start_year`, and `end_year` are attributes of an era identified by `era_id`, not
attributes of every event in that era.

The final gameplay relations are also in 3NF:

```text
GAME_SESSION(session_id PK, played_on, target_event_id FK, guesses_used, solved)
GUESS(
  guess_id PK, session_id FK, attempt_number, guessed_event_id FK,
  year_status, state_status, era_status, scale_status, tag_status
)
```

In `GAME_SESSION`, the session identifier determines every session attribute. In
`GUESS`, `guess_id` determines the recorded result, while the unique constraint on
`(session_id, attempt_number)` enforces the gameplay rule. No non-key result column
determines another non-key column. The statuses are a snapshot of the feedback shown
for that attempt; they are not category descriptions copied from `Event`.

## Functional dependencies

The principal dependencies are:

```text
event_id -> event_name, event_year, state_id, era_id, scale_id, description, image_url
state_id -> state_name, abbreviation
era_id -> era_name, start_year, end_year
scale_id -> scale_name, display_order
tag_id -> tag_name
(event_id, tag_id) -> no additional descriptive attributes
session_id -> played_on, target_event_id, guesses_used, solved
guess_id -> session_id, attempt_number, guessed_event_id, all five statuses
(session_id, attempt_number) -> guess_id, guessed_event_id, all five statuses
```

The first line is why event details belong in `EVENT`; the next four lines are why
lookup descriptions do not belong there. The composite dependency explains the
`EVENT_TAG` junction table. The final dependencies explain why a session and its
attempts are separate relations.

## Anomalies in the early design

### Update anomaly

In the all-in-one table, Pennsylvania appears in both the Declaration of
Independence and Battle of Gettysburg rows. If its abbreviation or spelling were
corrected, every matching event row would need an update. Missing one row would make
the database disagree with itself. In 3NF, the correction is made once in `STATE`.

### Insertion anomaly

The first design cannot add a new tag such as `Civil Rights` until an event uses it,
because the tag name is stored inside an event row. The separate `TAG` table can
accept a valid tag before an event is associated with it. Similarly, an empty
catalog does not prevent the lookup tables from being seeded.

### Deletion anomaly

If the only event labeled `Science` were deleted from the all-in-one table, the
database would also lose the fact that `Science` is a valid tag. In the normalized
design, deleting Moon Landing removes its `EVENT_TAG` association, but the `Science`
row remains in `TAG`.

### Gameplay anomaly

Without `GAME_SESSION` and `GUESS`, the application can calculate feedback in memory
but cannot reliably answer which target was used, how many attempts a player made, or
which event was guessed on attempt 3. Putting repeated guess columns into `EVENT`
would mix catalog facts with round facts. The separate relations preserve that
boundary.

## Integrity constraints and representative SQL

The following schema is the implementation target. `CHECK` constraints enforce
domain rules, foreign keys enforce relationships, and uniqueness constraints prevent
duplicate business values. The exact SQL dialect can be adapted to the eventual
backend, but the relational structure is independent of the mobile framework.

```sql
CREATE TABLE State (
    state_id INTEGER PRIMARY KEY,
    state_name VARCHAR(50) NOT NULL UNIQUE,
    abbreviation CHAR(2) NOT NULL UNIQUE
);

CREATE TABLE Era (
    era_id INTEGER PRIMARY KEY,
    era_name VARCHAR(100) NOT NULL UNIQUE,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    CHECK (start_year <= end_year)
);

CREATE TABLE Scale (
    scale_id INTEGER PRIMARY KEY,
    scale_name VARCHAR(30) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL UNIQUE CHECK (display_order > 0)
);

CREATE TABLE Tag (
    tag_id INTEGER PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Event (
    event_id INTEGER PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL UNIQUE,
    event_year INTEGER NOT NULL,
    state_id INTEGER NOT NULL,
    era_id INTEGER NOT NULL,
    scale_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(200),
    FOREIGN KEY (state_id) REFERENCES State(state_id),
    FOREIGN KEY (era_id) REFERENCES Era(era_id),
    FOREIGN KEY (scale_id) REFERENCES Scale(scale_id)
);

CREATE TABLE EventTag (
    event_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (event_id, tag_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tag(tag_id) ON DELETE RESTRICT
);

CREATE TABLE GameSession (
    session_id INTEGER PRIMARY KEY,
    played_on DATE NOT NULL,
    target_event_id INTEGER NOT NULL,
    guesses_used INTEGER NOT NULL DEFAULT 0
        CHECK (guesses_used BETWEEN 0 AND 15),
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (target_event_id) REFERENCES Event(event_id)
);

CREATE TABLE Guess (
    guess_id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 15),
    guessed_event_id INTEGER NOT NULL,
    year_status VARCHAR(9) NOT NULL
        CHECK (year_status IN ('correct', 'close', 'incorrect')),
    state_status VARCHAR(9) NOT NULL
        CHECK (state_status IN ('correct', 'close', 'incorrect')),
    era_status VARCHAR(9) NOT NULL
        CHECK (era_status IN ('correct', 'close', 'incorrect')),
    scale_status VARCHAR(9) NOT NULL
        CHECK (scale_status IN ('correct', 'close', 'incorrect')),
    tag_status VARCHAR(9) NOT NULL
        CHECK (tag_status IN ('correct', 'close', 'incorrect')),
    UNIQUE (session_id, attempt_number),
    FOREIGN KEY (session_id) REFERENCES GameSession(session_id) ON DELETE CASCADE,
    FOREIGN KEY (guessed_event_id) REFERENCES Event(event_id)
);
```

For a multi-tag comparison, the application can use a join rather than comparing a
single copied tag value:

```sql
SELECT t.tag_name
FROM EventTag AS et
JOIN Tag AS t ON t.tag_id = et.tag_id
WHERE et.event_id = :guessed_event_id
INTERSECT
SELECT t.tag_name
FROM EventTag AS et
JOIN Tag AS t ON t.tag_id = et.tag_id
WHERE et.event_id = :target_event_id;
```

## Reflection on the troubleshooting process

The main design problem was initially treating every event category as a single
property of an event. That matched the first UI but made the database responsible for
the UI's current limitation. I first listed what each identifier actually determined,
then checked whether a value could be reused by another event. That exposed the
partial dependency on the event/tag composite key and the transitive dependencies
through state, era, and scale.

I also separated catalog facts from play-session facts. A target event is a property
of a particular round, not a permanent property of the event itself. Recording
guesses separately made the 15-guess rule enforceable and made future statistics
possible without denormalizing the catalog. The resulting 3NF design uses more tables
than the first check-in, but each table has one clear responsibility, and the
insertion, deletion, and update anomalies have a direct place where they are
resolved.