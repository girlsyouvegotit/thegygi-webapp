import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import CommunityDriven from "@/components/home/CommunityDriven";
import Stats from "@/components/home/Stats";
import Programs from "@/components/home/Programs";
import Testimonial from "@/components/home/Testimonial";
import DonationCTA from "@/components/home/DonationCTA";
import Footer from "@/components/home/Footer";
import FAQ from "@/components/home/FAQ";
import Tutors from "@/components/home/Tutors";
import { PageSeo } from "@/components/seo/PageSeo";
import { organizationJsonLd, PAGE_SEO, websiteJsonLd } from "@/lib/seo";

const Home = () => {
  return (
    <div className="public-marketing font-sans bg-[#F2F2F4] text-foreground dark:bg-background">
      <PageSeo
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
        path="/"
        image="/Banner.jpg"
        jsonLd={[organizationJsonLd(), websiteJsonLd()]}
      />
      <Navbar />
      <main className="bg-[#F2F2F4] dark:bg-background">
        <Hero />
        <CommunityDriven />
        <Tutors />
        {/* Strategic Partners */}
        <section className="overflow-hidden border-y border-black/[0.04] py-16 dark:border-border">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 md:px-12">
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Strategic Industry Partners
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {["INTERNET SOCIETY", "IDEAT Africa", "PROJECT WANDEL"].map(
                (name) => (
                  <span
                    key={name}
                    className="cursor-default text-lg font-semibold text-muted-foreground transition-colors duration-300 hover:text-primary md:text-xl"
                  >
                    {name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>
        <Stats />
        <Programs />
        <Testimonial />
        <DonationCTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
