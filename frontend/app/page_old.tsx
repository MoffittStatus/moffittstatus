import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Wifi, SlidersHorizontal, Trophy } from 'lucide-react';


import HeroImage from '@/public/hero-campanile.png';

export default function HeroSection() {
  const features = [
    {
      icon: Wifi,
      title: 'Live Availability',
      description:
        'See real-time room counts and floor-by-floor breakdowns for every library on campus.',
    },
    {
      icon: SlidersHorizontal,
      title: 'Smart Filters',
      description:
        'Filter by noise level, amenities, hours, and study space type to find your perfect spot.',
    },
    {
      icon: Trophy,
      title: 'Earn Rewards',
      description:
        'Submit reports about library conditions and earn points toward badges and rewards.',
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="absolute inset-y-0 right-0 w-1/2  lg:block" />

      <div className="container relative z-10 mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-24">
          
          <div className="flex flex-col gap-y-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Find your study spot in seconds.
            </h1>

            <ul className="space-y-6">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full  bg-blue-100 ">
                    <feature.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Button asChild size="lg" className='bg-blue-400 hover:bg-blue-600'>
                <Link href="/hours">Browse Libraries</Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <Image
              src={HeroImage}
              alt="A view of the Campanile clock tower at UC Berkeley during sunset"
              width={450}
              height={600}
              priority
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}