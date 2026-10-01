Create a Web game to play Texas Holdem Poker with multiplayer.
If user want to single player, we can add AI Player to play with user.
The app will using fullstack NextJS for simplifying the backend and frontend.
Gameplay:

- We can use pure React to implement the game first.
- Use traditional Texas Holdem Poker.
- Each player will issue a specific amount of chips at the beginning.
  AI Player:
- Each AI Player will be an AI Agent using OpenRouter API to play with user. Each AI Player will start with a separated context, we pass the table state into LLM and get the decision of play.
- Using OpenRouter API, pick from the list of model name. For first phase, we can persist the conversation in memory.
  AI Agent:
- We will create a simple agent to play with user.
- AI Agent need to have a strategy to play poker. We can predefine a list of strategy prompt and use that to init AI Player.

Multiplayer: Websocket, can mixing player and AI. Next phase.
Let's draft the plan and save to markdown for me to review first.
