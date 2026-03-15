import { HeroSection } from "@/components/home/hero-section";
import { SpecialtiesSection } from "@/components/home/specialties-section";
import { TopDoctorsSection } from "@/components/home/top-doctors-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SpecialtiesSection />
      <TopDoctorsSection />
      <HowItWorksSection />
    </>
  );
}
