# Check In 1
*Due October 4th*

**Focus: Problem definition, mobile platform constraints, relational algebra, and intentional AI usage.**

## Problem Definition and Mobile Scope

Histole is a history-based (wow, who would have guessed) guessing game designed to do the one thing that no one can do besides very cool old people (love you grandma), make history fun and interesting to learn. Players will attempt to identify a target historical event using information about its year, state, historical era, event scale, and its tag.

Histole will be an iOS application because I want to use it after I develop the whole thing using React Native and Expo. Dev work will be done entirely in Visual Studio Code.

The project will primarily focus on the core gameplay of the Wordle-like game loop, with the player guessing an event and the app giving feedback on how close or far away their guess is to the target event. The player will have 15 guesses to get the correct event, and each time they guess they will be given a green, yellow, or gray color on each category "card", indicating whether the guessed attribute is correct, close to, or far away from the target event. 

For this semester, I'm going to focus on the primary game loop and database design, with outside features such as user logins and statistics/analytics tracking with streaks being added later or if I have time this semester.

## Initial Database Design and Mechanics

I plan on having 5 tables

EVENT, STATE, ERA, SCALE, and TAG

### Tables

EVENT
| Name | Data Type | Key | Description |
| event_id | INT | PK | Identifier for event |
| event_name | VARCHAR( 50) | | Name of the event |
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

[Relationship Logic]

### SQL and Relational Algebra

NEED SQL
NEED 5 STATEMENTS

## AI Utilization Plan

I plan on using GitHub Copilot for general help with coding the frontend, as I've never used React Native or Expo and intend of making this app look as good as possible while throwing my full bandwidth into the database design and development. 

I fully intend to manually program the backend databases, only using GitHub Copilot or other AI models if I truly get stuck or for other research ideas, for example with SQL errors or if my approach to problems is logically sound or not. After all, this is a databases class, my primary focus should be on the databases.

### Example Prompts

**Relational Algebra**
"Can you explain how to do a natural join between the EVENT, STATE, and ERA tables using relational algebra?"

**SQL Debugging**
"Here is the attached error message and SQL schema. I don't want the exact schema, but I want help identifying the problem so I can fix it. What's going on?"

**Database Design**
"In your opinion, did I design my tables correctly for the use-case of my game? Do I need a different relationship or something?"

**React Native**
"Give me step by step instructions on how to create a dropdown that populates with information from the database on the input field the user types on that relates to what they are currently typing. Don't implement it for me."