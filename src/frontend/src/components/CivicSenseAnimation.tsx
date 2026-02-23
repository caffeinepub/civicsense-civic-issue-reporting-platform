// INITIAL DESIGN DOCUMENTATION:
// The initial CivicSenseAnimation (About section) featured three value cards in a grid layout.
// - Section heading: "Building Better Communities Together"
// - Three cards: Cleanliness (Sparkles icon), Safety (Heart icon), Responsibility (Users icon)
// - Icons: Lucide-react icons displayed in circular backgrounds with primary color
// - Layout: Grid with md:grid-cols-3 responsive breakpoint
// - Background: Standard muted background (bg-muted/50)
// - No custom generated images used (cleanliness-civic-value.png, safety-civic-value.png, responsibility-civic-value.png were available but not displayed)
// - No gradient effects or animations
//
// CURRENT VERSION 35 STATE:
// This implementation matches the initial design. Uses Lucide icons instead of generated
// image assets, with standard theme styling and no special effects.

import { Sparkles, Heart, Users } from 'lucide-react';

export default function CivicSenseAnimation() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Building Better Communities Together
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">
            CivicSense empowers citizens to take an active role in improving their neighborhoods through transparent reporting and community engagement.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Cleanliness</h3>
              <p className="text-center text-sm text-muted-foreground">
                Keep our streets and public spaces clean and welcoming for everyone
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Safety</h3>
              <p className="text-center text-sm text-muted-foreground">
                Ensure safe infrastructure and well-maintained public facilities
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Responsibility</h3>
              <p className="text-center text-sm text-muted-foreground">
                Take collective ownership of our community's well-being
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
