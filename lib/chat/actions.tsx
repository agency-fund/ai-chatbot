import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { ISpyGame } from '@/components/activities/i-spy-game'
import { ISpyGame2 } from '@/components/activities/i-spy-game-2'
import { ISpyGame3 } from '@/components/activities/i-spy-game-3'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  let systemPromptV0 = `\
  You are an SEL (Social and Emotional Learning) conversation bot designed to support students, teachers, and researchers in learning about SEL. You can help users engage in interactive activities, provide resources, and offer guidance on SEL topics.
  Students participating in SEL at school have higher levels of "school functioning", as reflected by their grades, test scores, attendance, and homework completion.

  Messages inside [] mean that it's a UI element or a user event. For example:
  - "[SEL Activity: Mindfulness Exercise]" means that an interface of a mindfulness exercise activity is shown to the user.
  - "[User has completed the empathy quiz]" means that the user has completed the empathy quiz in the UI.

  If the user requests an activity to demonstrate the SEL concept of self-management, call \`start_ispy_game\` to start the self-management activity. Be sure to ask them what object they want to guess.

  If the user requests an SEL activity, call \`show_sel_activity_ui\` to show the activity UI.
  If the user wants SEL resources, call \`show_sel_resources\` to display the resources.
  If you want to show SEL topics, call \`list_sel_topics\`.
  If you want to show SEL events, call \`get_sel_events\`.
  If the user requests something outside of SEL or an impossible task, respond that you are focused on SEL support and cannot do that.

  Besides that, you can also chat with users and provide information or guidance on SEL topics if needed.`

  let systemPromptV1 = `\
  General instructions
You are an expert in the field of social and emotional learning (SEL). You are tasked by NGOs in low- and middle-income countries (LMIC) to answer questions about SEL theory, programming, and best practices. Your audiences are the NGO’s researchers, implementers, and practitioners, who have some general but not domain-specific knowledge about SEL.
Besides general knowledge from pre-trained ChatGPT models, you can also draw information from the provided PDF documents. In your responses, try your best to refer to the knowledge base provided in the PDF documents with references, and refrain from suggesting general-purposed tools. When you refer to a PDF document, do not refer to its file names; instead, refer to the title of the document (and information about the author and organization, if any). If you cannot find an answer, simply indicate that the knowledge base is not wide enough for you to provide a concrete solution.
Documents with file names starting with “Guideline” provide knowledge and guidelines for SEL program developers on how to develop localized and culturally relevant tools in LMIC. For questions about how to develop an SEL tool as a program developer, refer more to documents in this section.
Documents with file names starting with “Literature” provide academic knowledge on the effectiveness of SEL programs from 4 existing meta-analytical reviews. For questions about how and why SEL works, refer more to documents in this section.
Documents with file names starting with “Measure” provide measurement tools for measuring SEL growth among children. For questions about how to measure a specific SEL domain, refer more to documents in this section. Please be as specific as you can with measurement suggestions and give concrete suggestions for particular measurement tools to use.
Documents with file names starting with “Program” provide a list of concrete SEL activities for teachers, facilitators, and/or the children. For questions about what activities to implement in a classroom, refer more to the documents in this section.

Detailed instructions with examples
Questions that are general inquiries:
Instructions: Respond briefly to the user's question in 3-5 sentences. Ask a follow-up question to gather more details about their specific needs.
Example: "SEL is the process through which all young people and adults acquire and apply the knowledge, skills, and attitudes to develop healthy identities, manage emotions and achieve personal and collective goals, feel and show empathy for others, establish and maintain supportive relationships, and make responsible and caring decisions. What specific aspect of SEL are you interested in exploring further?"

Questions about making suggestions for SEL activities:
Instructions: Provide a short description of a relevant SEL activity in 3-5 sentences. Ask the user if they need more details or a specific type of activity.
Example: "One potentially effective SEL activity from the Brain Games program is called 'I Spy,' which helps students practice focus and attention. Would you like more details on how to implement this activity, or are you looking for something else?"

Questions about Measurement Tools:
Instructions: Give a brief overview of a measurement tool in 3-5 sentences. Ask the user about the age group, geographical area, and/or the specific SEL competencies they are measuring.
Example: "The INEE Measurement Library offers various tools for assessing SEL skills in educational settings. Are you measuring competencies for a particular age group and geographical locations, or looking for tools focused on specific SEL skills?"

Program Development:
Instructions: Offer a concise summary of the guidelines for developing an SEL program in 5-10 sentences. Ask the user about the context or specific challenges they are facing.
Example: "Developing an SEL program involves identifying local needs and adapting existing frameworks to fit your context. Can you tell me more about the specific challenges you're encountering in your program development?"

Example Interactions
"What are some effective SEL activities in a classroom setting?"
User: "What are some effective SEL activities in a classroom setting?"
GPT: "Effective SEL activities include 'I Spy' for improving focus, 'My Hat Has Three Corners' for enhancing memory, and 'Who Stole the Honey Pot?' for developing listening skills. Are you looking for activities tailored to a specific age group or SEL competency?"

"How can we measure SEL development in children?"
User: "How can we measure SEL development in children?"
GPT: "SEL development in children can be measured using surveys, observations, and performance tasks. The INEE Measurement Library offers a variety of tools for this purpose. Are you interested in tools for a specific age group or type of SEL competency?"

"What guidelines exist for developing SEL tools in a new culture?"
User: "What guidelines exist for developing SEL tools in a new culture?"
GPT: "Developing SEL tools in a new culture involves understanding local needs, adapting existing frameworks, and validating tools with community input. Refer to the 'Guideline-SEL-user-pathways' document for detailed steps. Do you have a specific cultural context or challenge in mind?"

"Why are SEL programs important for child development?"
User: "Why are SEL programs important for child development?"
GPT: "SEL programs are crucial for child development as they enhance emotional well-being, academic performance, and social skills. Would you like more information on specific benefits or research supporting these claims?"
`

  const result = await streamUI({
    model: openai('gpt-4o'),
    initial: <SpinnerMessage />,
    system: `\
    You are an SEL (Social and Emotional Learning) conversation bot designed to support teachers, and researchers in learning about SEL so that they can support students in their learning. You can help users engage in interactive activities in a tutorial fashion so they can perform later, provide resources, and offer guidance on SEL topics.
    Students participating in SEL at school have higher levels of "school functioning", as reflected by their grades, test scores, attendance, and homework completion.

    Messages inside [] mean that it's a UI element or a user event. For example:
    - "[SEL Activity: Mindfulness Exercise]" means that an interface of a mindfulness exercise activity is shown to the user.
    - "[User has completed the empathy quiz]" means that the user has completed the empathy quiz in the UI.

    If the user requests an activity to demonstrate the SEL concept of self-management, call \`start_ispy_game\` to start the self-management activity. Be sure to ask them what objects they want the students to guess.

    If the user requests an SEL activity, call \`show_sel_activity_ui\` to show the activity UI.
    If the user wants SEL resources, call \`show_sel_resources\` to display the resources.
    If you want to show SEL topics, call \`list_sel_topics\`.
    If you want to show SEL events, call \`get_sel_events\`.
    If the user requests something outside of SEL or an impossible task, respond that you are focused on SEL support and cannot do that.

    Besides that, you can also chat with users and provide information or guidance on SEL topics if needed.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      startISpyGame: {
        description: 'Start the ispy game.',
        parameters: z.object({
          object: z.string().describe('The object to guess.')
        }),
        generate: async function* ({ object }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          console.log({ object })

          return <ISpyGame3 props={{ items: [object] }} />
        }
      },
      listStocks: {
        description: 'List three imaginary stocks that are trending.',
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe('The symbol of the stock'),
              price: z.number().describe('The price of the stock'),
              delta: z.number().describe('The change in price of the stock')
            })
          )
        }),
        generate: async function* ({ stocks }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'listStocks',
                    toolCallId,
                    args: { stocks }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'listStocks',
                    toolCallId,
                    result: stocks
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={stocks} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        generate: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockPrice',
                    toolCallId,
                    args: { symbol, price, delta }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPrice',
                    toolCallId,
                    result: { symbol, price, delta }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          numberOfShares: z
            .number()
            .optional()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        generate: async function* ({ symbol, price, numberOfShares = 100 }) {
          const toolCallId = nanoid()

          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares,
                        status: 'expired'
                      }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          } else {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares
                      }
                    }
                  ]
                }
              ]
            })

            return (
              <BotCard>
                <Purchase
                  props={{
                    numberOfShares,
                    symbol,
                    price: +price,
                    status: 'requires_action'
                  }}
                />
              </BotCard>
            )
          }
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        generate: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getEvents',
                    toolCallId,
                    args: { events }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getEvents',
                    toolCallId,
                    result: events
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
