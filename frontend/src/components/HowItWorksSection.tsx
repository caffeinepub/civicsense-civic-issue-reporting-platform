import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface WorkflowCardProps {
  number: string;
  title: string;
  description: string;
  badgeColor: string;
  showArrow?: boolean;
}

function WorkflowCard({ number, title, description, badgeColor, showArrow = true }: WorkflowCardProps) {
  return (
    <div className="flex items-center gap-4">
      <Card className="flex-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="p-6">
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${badgeColor} text-xl font-bold text-white`}
          >
            {number}
          </div>
          <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
      {showArrow && (
        <ArrowRight className="hidden h-8 w-8 flex-shrink-0 text-muted-foreground lg:block" />
      )}
    </div>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Report Issue',
      description: 'Easily report issues by choosing category, providing details, and attaching a photo.',
      badgeColor: 'bg-[#FF7A50]',
    },
    {
      number: '2',
      title: 'Authority Reviews',
      description: 'Municipal authorities review and prioritize the reported issues.',
      badgeColor: 'bg-blue-500',
    },
    {
      number: '3',
      title: 'Issue Resolved',
      description: 'Authorities take action and resolve the issue promptly.',
      badgeColor: 'bg-green-500',
    },
  ];

  return (
    <section id="how-it-works" className="bg-background py-16 md:py-24">
      <div className="container px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
          How CivicSense Works
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <WorkflowCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              badgeColor={step.badgeColor}
              showArrow={index < steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
