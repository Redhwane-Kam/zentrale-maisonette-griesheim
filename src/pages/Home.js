import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import BookingForm from "../components/BookingForm";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import AmenitiesList from "../components/AmenitiesList";
import CancellationPolicy from "../components/CancellationPolicy";
import HeroCarousel from "../components/HeroCarousel";
import RoomsGallery from "../components/RoomsGallery";
import ContactBlock from "../components/ContactBlock";
import { heroCarouselImages } from "../data/roomsGallery";
import "./Home.css";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <header className="site-header">
        <div className="logo">Zentrale Maisonette Griesheim</div>
        <nav className="main-nav">
          <a href="#gallery">{t.nav.gallery}</a>
          <a href="#amenities">{t.nav.amenities}</a>
          <a href="#booking">{t.nav.booking}</a>
          <a href="#contact">{t.nav.contact}</a>
        </nav>
        <LanguageSwitcher />
      </header>

      <section className="hero">
        <HeroCarousel images={heroCarouselImages} />
        <h1>{t.hero.title}</h1>
        <p>{t.hero.subtitle}</p>
        <a href="#booking" className="cta-button">{t.hero.cta}</a>

        <div className="hero-welcome">
          {t.hero.welcomeText.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section id="gallery" className="gallery">
        <h2>{t.nav.gallery}</h2>
        <RoomsGallery />
      </section>

      <section id="amenities" className="amenities">
        <h2>{t.amenities.title}</h2>
        <AmenitiesList />
      </section>

      <section id="booking" className="booking-section">
        <AvailabilityCalendar />
        <BookingForm />
        <CancellationPolicy />
      </section>

      <section id="contact" className="contact-section">
        <h2>{t.contact.title}</h2>
        <ContactBlock />
      </section>

      <footer className="site-footer">
        <p>{t.footer.contact} · © {new Date().getFullYear()} — {t.footer.rights}</p>
        <p><a href="/impressum" className="footer-legal-link">{t.impressum.title}</a></p>
      </footer>
    </div>
  );
}
