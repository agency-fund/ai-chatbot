import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to SEL Chatbot!</h1>
        <p className="leading-normal text-muted-foreground">
          SEL Chatbot is designed to support{' '}
          <ExternalLink href="https://en.wikipedia.org/wiki/Social–emotional_learning">
            social and emotional learning
          </ExternalLink>{' '}
          by offering interactive activities, resources, and guidance for{' '}
          students, teachers, and researchers to learn about SEL.
        </p>
        <p className="leading-normal text-muted-foreground">
          Students participating in SEL at school have higher levels of{' '}
          <ExternalLink href="https://osf.io/mk35u">
            “school functioning,”
          </ExternalLink>{' '}
          as reflected by their grades, test scores, attendance, and homework
          completion.
        </p>
      </div>
    </div>
  )
}
