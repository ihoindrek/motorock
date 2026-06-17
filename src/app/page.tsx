import { Hero } from "@/components/hero";
import { RidersFavorites } from "@/components/riders-favorites";

export const revalidate = 300;

export default function Home() {
  return (
    <>
      <Hero />
      <RidersFavorites />
    </>
  );
}
