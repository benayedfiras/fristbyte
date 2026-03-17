import './App.css';
import LandingPage from './LandingPage';
import ServicesSection from './components/ServicesSection';
import ServicesSolar from './components/ServicesSolar';
import ServicesCards3D from './components/ServicesCards3D';
import ServicesOS from './components/ServicesOS';
import ServicesTimeline from './components/ServicesTimeline';
import ServicesMap from './components/ServicesMap';
import ServicesPortal from './components/ServicesPortal';
import ServicesGlobe from './components/ServicesGlobe';
import ServicesTerminal from './components/ServicesTerminal';
import ServicesMorphing from './components/ServicesMorphing';
import ServicesDesktop from './components/ServicesDesktop';

const LABELS = [
  'Option 1: Hex Grid',
  'Option 2: Solar',
  'Option 3: Card Deck',
  'Option 4: OS Desktop',
  'Option 5: Cylinder',
  'Option 6: City Map',
  'Option 7: Portal Doors',
  'Option 8: Globe',
  'Option 9: Terminal',
  'Option 10: Morphing Blob',
  'Option 11: Cartoon Desktop',
];

function SectionLabel({ label }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: '16px',
        zIndex: 999,
        pointerEvents: 'none',
        padding: '0 16px',
        height: 0,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '999px',
          padding: '6px 16px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.5px',
          pointerEvents: 'auto',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <LandingPage />

      <SectionLabel label={LABELS[0]} />
      <ServicesSection />

      <SectionLabel label={LABELS[1]} />
      <ServicesSolar />

      <SectionLabel label={LABELS[2]} />
      <ServicesCards3D />

      <SectionLabel label={LABELS[3]} />
      <ServicesOS />

      <SectionLabel label={LABELS[4]} />
      <ServicesTimeline />

      <SectionLabel label={LABELS[5]} />
      <ServicesMap />

      <SectionLabel label={LABELS[6]} />
      <ServicesPortal />

      <SectionLabel label={LABELS[7]} />
      <ServicesGlobe />

      <SectionLabel label={LABELS[8]} />
      <ServicesTerminal />

      <SectionLabel label={LABELS[9]} />
      <ServicesMorphing />

      <SectionLabel label={LABELS[10]} />
      <ServicesDesktop />
    </>
  );
}

export default App;
