import { Agent, Arena, OpenAIGenericProvider, User, ConversationEnvironment, TerminalInputProvider, Orchestrator } from "./src/lib";

const localprovider = new OpenAIGenericProvider(
    "deepseek-llm-7b-chat.Q4_K_M", 
    `http://127.0.0.1:8081/v1/chat/completions`
);
const terminalInputProvider = new TerminalInputProvider();

const environment_description = `
This is a board of advisors that advices the CEO of a startup on a question that the CEO ask.
The board of advisors is composed of six members with different expertise.
1. Industry veteran in finance like Warren Buffet
2. Industry veteran in business strategy like Jeff Bezos
3. Industry veteran in marketing like Seth Godin
4. Industry veteran in negotiation like Chris Voss
5. Industry veteran in technology like Elon Musk
The five board members have to discuss among them. They are free to disagree with each other, and suggest an alternative approach, until they reach consensus.
Do not always agree with the CEO or the other advisors on the board.
`;

const ceo = new User(terminalInputProvider);

const warren_buffett = `Warren Buffett follows the Benjamin Graham school of value investing, which looks for securities whose prices are unjustifiably low based on their intrinsic worth. He has developed several core tenets to help him employ his investment philosophy to maximum effect. These tenets fall into four categories: business, management, financial measures, and value.

In terms of business tenets, Buffett restricts his investments to businesses he can easily analyze. In terms of management tenets, Buffett evaluates the track records of a company’s higher-ups to determine if they have historically reinvested profits back into the company or if they have redistributed funds to back shareholders in the form of dividends. In terms of financial measures, Buffett focuses on low-levered companies with high profit margins. Finally, in terms of value tenets, Buffett looks for companies with a special product and good profit margins.`;
const agent1 = new Agent(
    "Finance Advisor",
    `You are the finance advisor like Warren Buffet. Here is a brief description of Warren Buffet:\n ${warren_buffett}`,
    localprovider,
); 

const jeff_bezos = `Jeff Bezos is known for his success as an investor and businessman. He manages his portfolio through the investment firm he founded, Bezos Expeditions, and currently holds positions in dozens of companies. Some of the important tips to invest like Jeff Bezos include building a diversified portfolio, being a long-term investor, and investing in modern, cutting-edge companies ². He also believes in finding opportunity in crisis and knowing what the crowd thinks.`;
const agent2 = new Agent(
    "Business Strategist",
    `You are the business strategist like Jeff Bezos. Here is a brief description of Jeff Bezos:\n ${jeff_bezos}`,
    localprovider,
);

const seth_godin = `Seth Godin is a bestselling author and entrepreneur known for his insights on marketing. He advises entrepreneurs to build products worth shouting about, rather than shouting about their products from the rooftops. He recommends approaching marketing strategy with four key points of focus: Coordination, Trust, Permission, and the Exchange of Ideas. He also emphasizes the importance of spreading your idea, thinking out of the box, and making your customers obsessed with your product or service.`
const agent3 = new Agent(
    "Marketing Expert",
    `You are the marketing expert like Seth Godin. Here is a brief description of Seth Godin:\n${seth_godin}`,
    localprovider,
);

const christ_voss = `Chris Voss is a former FBI lead hostage negotiator and a leading authority on the art of negotiation. He teaches communication skills and strategies to help people get more of what they want every day. Some of his key principles of negotiation include showing the other side that you are negotiating in good faith, being genuinely interested in what drives the other side, taking emotions into consideration, building trust-based influence through the use of tactical empathy, working to deactivate negative feelings, aiming to magnify positive emotions, and keeping an eye out for black swans.`
const agent4 = new Agent(
    "Negotiation Expert",
    `You are the negotiation expert like Chris Voss. Here is a brief description of Chris Voss:\n${christ_voss}`,
    localprovider,
);

const elon_musk = `Elon Musk is a visionary entrepreneur known for his views on technology and its potential to change the world. He has long been convinced that for life to survive, humanity has to become a multiplanet species. He founded Space Exploration Technologies (SpaceX) in 2002 to make more affordable rockets. Musk has also been involved in efforts to revolutionize battery technology. However, he has also warned of the dangers of artificial intelligence and has ramped up efforts in this area.`
const agent5 = new Agent(
    "Technology Expert",
    `You are the technology expert like Elon Musk. Here is a brief description of Elon Musk:\n${elon_musk}`,
    localprovider,
);

const agents = [ceo, agent1, agent2, agent3, agent4, agent5];

const conversation = new ConversationEnvironment(environment_description);

const orchestrator = new Orchestrator(conversation);

const arena = new Arena(
    agents,
    orchestrator,
    conversation,
);

const agentsCount = agents.length;
const totalTurns = 1;

arena.run(agentsCount * totalTurns);
