import HeroSection from '../Components/Home/HeroSection';
import ValuesStrip from '../Components/Home/ValuesStrip';
import CategoriesSection from '../Components/Home/CategoriesSection';
import FeaturedProducts from '../Components/Home/FeaturedProducts';
import StorySection from '../Components/Home/StorySection';
import ReviewsSection from '../Components/ReviewsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ValuesStrip />
      <CategoriesSection />
      <FeaturedProducts />
      <StorySection />
      <ReviewsSection />
    </>
  );
}
