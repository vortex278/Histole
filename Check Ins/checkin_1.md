# Check In 1
*Due October 4th*

**Focus: Problem definition, mobile platform constraints, relational algebra, and intentional AI usage.**

## Problem Definition and Mobile Scope

Histole is a history-based (wow, who would have guesses) guessing game designed to do the one thing that only really cool old people can do (love you, grandma). Make learning about history more interactive. Players attempt to identify a target historical event using information about its year, state, historical era, event scale, and tag.

Histole will be an iOS application, because I want to use the thing after I develop it, developed with React Native and Expo. Development will be done in Visual Studio Code.

The project will primarily focus on the core gameplay of the Wordle-like game loop, with the player guessing an event and the app giving feedback on how close or far away their guess is to the target event. The player will have 15 guesses to get the correct event, and each time they guess they will be given a green, yellow, or gray color on each category "card", indicating whether the guessed attribute is correct, close to, or far away from the target event. 

For this semester, I'm going to focus on the primary game loop and database design, with outside features such as user logins and statistics/analytics tracking with streaks being added later or if I have time this semester.

### Color Rules

This is just a quick general idea on what dictates the different colors of feedback for each category:
- Year: Considered 'close' (Yellow) when it is within 10 years in either direction of the target event
- State: States are considered 'close' when it borders the target state. Anything not listed in the border states is considered far away, and therefore grey. This logic is already set up, and you can see how it works in "event-logic.ts"
- Era: An era is considered 'close' when it is adjacent to the target event's era in the chronological ordering.
- Scale: A scale is considered 'close' when it is adjacent to the target event's scale in the scope ordering.
- Tag: Tags are either matching or non-matching. There is no closeness ranking because I'm not exactly sure how to rank the closeness of military and civil rights events, for example.

## Initial Database Design and Mechanics

I plan on having 5 tables

EVENT, STATE, ERA, SCALE, and TAG

### Tables

EVENT
| Name | Data Type | Key | Description |
| event_id | INT | PK | Identifier for event |
| event_name | VARCHAR(100) | | Name of the event |
| event_year | INT | | Year event happened |
| state_id | INT | FK | References State(state_id) |
| era_id | INT | FK | References Era(era_id) |
| scale_id | INT | FK | References Scale(scale_id) |
| tag_id | INT | FK | References Tag(tag_id) |
| description | TEXT | | Description of historical event to be shown at the end of the game |

STATE
| Name | Data Type | Key | Description |
| state_id | INT | PK | Identifier for state |
| state_name | VARCHAR(50) | | Name of state |
| abbreviation | CHAR(2) | | State abbreviation |

ERA
| Name | Data Type | Key | Description |
| era_id | INT | PK | Identifier for historical era |
| era_name | VARCHAR(100) | | Name of historical era |
| start_year | INT | | Beginning year of era |
| end_year | INT | | Ending year of era |

SCALE
| Name | Data Type | Key | Description |
| scale_id | INT | PK | Identifier for event scale |
| scale_name | VARCHAR(30) | | Local, State, Regional, National, International |

TAG
| Name | Data Type | Key | Description |
| tag_id | INT | PK | Identifier for tag | 
| tag_name | VARCHAR(50) | | Name of event tag |

### Table Relationship

EVENT.state_id -> STATE.state_id
EVENT.era_id -> ERA.era_id
EVENT.scale_id -> SCALE.scale_id
EVENT.tag_id -> TAG.tag_id

### SQL Schema

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
    scale_name VARCHAR(30) NOT NULL UNIQUE
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
    tag_id INTEGER NOT NULL,
    description TEXT NOT NULL,

    FOREIGN KEY (state_id) REFERENCES State(state_id),
    FOREIGN KEY (era_id) REFERENCES Era(era_id),
    FOREIGN KEY (scale_id) REFERENCES Scale(scale_id),
    FOREIGN KEY (tag_id) REFERENCES Tag(tag_id)
);

### Relational Algebra

These relational-algebra queries are based on Histole's planned gameplay. They demonstrate how the database would retrieve the daily target, locate a player's selected event, gather the attributes needed for feedback, compare the guess with the target, and identify matching tags. In these expressions, `target_id` i a value supplied by the game, while `guessed_name` is user input.

For the relational algebra stuff below, `T = σ event_id = target_id (EVENT)` represents the target event and `G = σ event_name = guessed_name (EVENT)` represents the player's selected event.

1. Select the daily target event:

    T = σ event_id = target_id (EVENT)

2. Find the event selected by the player:

    G = σ event_name = guessed_name (EVENT)

3. Retrieve the attributes needed to provide feedback for the player's guessed event:

        π G.event_name, G.event_year, STATE.state_name, ERA.era_name, SCALE.scale_name, TAG.tag_name
    (
            G ⋈ G.state_id = STATE.state_id STATE
                ⋈ G.era_id = ERA.era_id ERA
                ⋈ G.scale_id = SCALE.scale_id SCALE
                ⋈ G.tag_id = TAG.tag_id TAG
    )

        This retrieves the category values for the guessed event. The same expression can be applied to `T` to retrieve the target event's values, after which the application compares the two results using the rules described above.

4. Compare the guessed event's year with the target event's year:

    σ |G.event_year - T.event_year| ≤ 10 (G × T)

5. Determine whether the guessed event and target event have the same tag:

    π G.event_name, T.event_name
    (σ G.tag_id = T.tag_id (G × T))

These queries describe the planned database-backed version of the game. The current prototype uses five in-memory mock events, but these operations represent the database actions needed to support the core guessing loop.


## AI Utilization Plan

I plan on using GitHub Copilot Chat in Visual Studio Code for general tutoring, documentation research, and limited frontend assistance. I have not used React Native or Expo before, so I want to be able to ask for explanations of their APIs and for step-by-step implementation help.

I fully intend to manually design and program the database schema. I want to use AI as a research partner and tutor for debugging rather than asking it to generate the database for me. This is a databases class, I should know how to program databases.

### Example Prompts

**Relational Algebra**
"Can you explain how to do a natural join between the EVENT, STATE, and ERA tables using relational algebra?"

**SQL Debugging**
"Here is the attached error message and SQL schema. I don't want the exact schema, but I want help identifying the problem so I can fix it. What's going on?"

**Database Design**
"In your opinion, did I design my tables correctly for the use-case of my game? Do I need a different relationship or something?"

**React Native**
"Give me step by step instructions on how to create a dropdown that populates with information from the database on the input field the user types on that relates to what they are currently typing. Don't implement it for me."