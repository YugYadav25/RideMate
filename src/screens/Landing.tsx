import { ArrowRight, Shield, Globe, Zap, Smartphone, Users, Layers, MapPin, ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import CustomCursor from '../components/CustomCursor/CustomCursor';
import RollingReviews from '../components/RollingReviews/RollingReviews';
import AnimatedSection from '../components/AnimatedSection/AnimatedSection';
import Footer from '../components/Footer';
import '../styles/landing.css';
import { useState } from 'react';

export default function Landing() {
  const { navigateTo, authToken } = useApp();
  const [activeTab, setActiveTab] = useState<'home' | 'platform' | 'cities' | 'safety' | 'about'>('home');

  const cities = [
    { name: 'Mumbai', status: 'Live', rides: '12K+' },
    { name: 'Delhi NCR', status: 'Live', rides: '15K+' },
    { name: 'Bangalore', status: 'Live', rides: '10K+' },
    { name: 'Pune', status: 'Beta', rides: '2K+' },
    { name: 'Hyderabad', status: 'Coming Soon', rides: '-' },
    { name: 'Chennai', status: 'Coming Soon', rides: '-' },
  ];

  return (
    <div className="landing-page w-full min-h-screen overflow-x-hidden flex flex-col">
      <CustomCursor />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
          {/* Logo - Left */}
          <div className="flex items-center gap-3 cursor-hover justify-start" onClick={() => setActiveTab('home')}>
            <img
              src="/ridemate_logo.png"
              alt="RideMate - Mobility, Reimagined"
              className="h-16 w-auto object-contain rounded-2xl border border-black"
            />
          </div>

          {/* Tab Navigation in Header - Center */}
          <div className="flex items-center justify-center gap-2">
            {(['home', 'platform', 'cities', 'safety', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium px-3 py-2 rounded-full transition-all capitalize whitespace-nowrap ${activeTab === tab
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab === 'about' ? 'About Us' : tab}
              </button>
            ))}
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex items-center gap-3 justify-end">
            {authToken ? (
              <Button onClick={() => { }} size="sm" className="cursor-default opacity-50">
                Dashboard
              </Button>
            ) : (
              <>
                <button onClick={() => navigateTo('login')} className="text-base font-medium hover:text-gray-600 transition-colors cursor-hover px-3 py-2">
                  Log in
                </button>
                <Button onClick={() => navigateTo('signup')} size="lg" className="bg-black text-white hover:bg-gray-800 cursor-hover px-5 py-2.5 text-base">
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="w-full flex-grow">
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-section w-full">
              <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col justify-center">
                  <AnimatedSection delay={200}>
                    <h1 className="hero-title">
                      Mobility,<br />
                      Reimagined.
                    </h1>
                  </AnimatedSection>

                  <AnimatedSection delay={400}>
                    <p className="hero-subtitle">
                      Experience the future of urban transportation. Seamless, sustainable, and designed for the modern world.
                    </p>
                  </AnimatedSection>

                  <AnimatedSection delay={600}>
                    <div className="hero-buttons">
                      <Button
                        size="lg"
                        onClick={() => navigateTo('signup')}
                        className="bg-black text-white hover:bg-gray-800 cursor-hover px-6 py-3 text-lg"
                      >
                        Start Riding
                        <ArrowRight className="ml-2" size={20} />
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => setActiveTab('platform')}
                        className="bg-white text-black border border-black/10 px-8 py-4 rounded-full text-lg hover:bg-gray-50 cursor-hover"
                      >
                        Learn More
                      </Button>
                    </div>
                  </AnimatedSection>
                </div>

                <AnimatedSection delay={800} className="hidden md:block">
                  <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-black/5 transform hover:scale-[1.02] transition-transform duration-500">
                    <img
                      src="/hero_image.jpg"
                      alt="RideMate Hero"
                      className="w-full h-auto block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                </AnimatedSection>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-white w-full">
              <div className="max-w-7xl mx-auto">
                <AnimatedSection className="section-header">
                  <span className="section-label">Why RideMate</span>
                  <h2 className="section-title">Engineered for Excellence</h2>
                </AnimatedSection>

                <div className="grid md:grid-cols-3 gap-8">
                  <AnimatedSection delay={200} direction="up">
                    <div className="feature-card cursor-hover">
                      <div className="feature-icon-wrapper">
                        <Zap size={24} />
                      </div>
                      <h3 className="feature-title">Lightning Fast</h3>
                      <p className="feature-desc">
                        Our predictive algorithms ensure the quickest routes and minimal wait times, getting you there faster.
                      </p>
                    </div>
                  </AnimatedSection>

                  <AnimatedSection delay={400} direction="up">
                    <div className="feature-card cursor-hover">
                      <div className="feature-icon-wrapper">
                        <Shield size={24} />
                      </div>
                      <h3 className="feature-title">Safety First</h3>
                      <p className="feature-desc">
                        Verified drivers, real-time tracking, and 24/7 support. Your safety is our absolute priority.
                      </p>
                    </div>
                  </AnimatedSection>

                  <AnimatedSection delay={600} direction="up">
                    <div className="feature-card cursor-hover">
                      <div className="feature-icon-wrapper">
                        <Globe size={24} />
                      </div>
                      <h3 className="feature-title">Global Scale</h3>
                      <p className="feature-desc">
                        Available in major cities worldwide. One app, endless destinations. Travel without boundaries.
                      </p>
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </section>

            {/* Rolling Reviews */}
            <section className="py-24 bg-gray-50 overflow-hidden w-full">
              <AnimatedSection className="section-header">
                <span className="section-label">Community</span>
                <h2 className="section-title">Loved by Thousands</h2>
              </AnimatedSection>
              <RollingReviews />
            </section>

            {/* App Showcase */}
            <section id="app-showcase" className="py-24 px-6 bg-black text-white w-full">
              <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <AnimatedSection direction="right">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 block">The App</span>
                  <h2 className="text-5xl font-bold mb-6">Power in your pocket.</h2>
                  <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    Manage rides, track payments, and connect with drivers—all from a beautifully designed interface.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 cursor-hover hover:bg-white/10 transition-colors">
                      <Smartphone size={24} />
                      <div>
                        <p className="text-xs text-gray-400">Download on the</p>
                        <p className="font-bold">App Store</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 cursor-hover hover:bg-white/10 transition-colors">
                      <Smartphone size={24} />
                      <div>
                        <p className="text-xs text-gray-400">Get it on</p>
                        <p className="font-bold">Google Play</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection direction="left" delay={300}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-center driver-partner-section">
                      <div className="text-center driver-partner-content">
                        <Users size={48} className="mx-auto mb-4 text-white/80" />
                        <h3 className="text-2xl font-bold mb-2">Driver Partner?</h3>
                        <p className="text-gray-400 mb-6">Join our fleet and earn on your terms.</p>
                        <Button onClick={() => navigateTo('signup')} variant="secondary" className="bg-white text-black hover:bg-gray-200 cursor-hover">
                          Become a Driver
                        </Button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </section>
          </>
        )}

        {activeTab === 'platform' && (
          <div className="pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection>
                <h1 className="hero-title text-center mb-16">The RideMate<br />Architecture</h1>
              </AnimatedSection>

              <div className="space-y-20">
                <AnimatedSection delay={200}>
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                        <Layers size={24} />
                      </div>
                      <h2 className="text-3xl font-bold mb-4">Full-Stack Mobility</h2>
                      <p className="text-gray-600 leading-relaxed">
                        Our platform integrates real-time dispatching, predictive routing, and seamless payments into a unified infrastructure.
                        Whether you're a daily commuter or a fleet manager, RideMate scales to your needs.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-3xl p-8 aspect-square flex items-center justify-center border border-black/5">
                      <div className="text-center">
                        <p className="text-6xl font-black mb-2">99.9%</p>
                        <p className="text-gray-500 uppercase tracking-widest text-sm">Uptime Reliability</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                  <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                    <div className="order-2 md:order-1 bg-black text-white rounded-3xl p-8 aspect-square flex items-center justify-center">
                      <div className="text-center">
                        <Zap size={48} className="mx-auto mb-4" />
                        <p className="text-2xl font-bold">Real-Time Sync</p>
                      </div>
                    </div>
                    <div className="order-1 md:order-2">
                      <h2 className="text-3xl font-bold mb-4">Instantaneous Data</h2>
                      <p className="text-gray-600 leading-relaxed">
                        Every ride, driver location, and transaction is synced in milliseconds.
                        Our WebSocket-based architecture ensures you never miss a beat, with live updates pushed directly to your device.
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cities' && (
          <div className="pt-24 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
              <AnimatedSection>
                <h1 className="hero-title text-center mb-8">Global Reach,<br />Local Impact.</h1>
                <p className="text-center text-gray-600 max-w-2xl mx-auto mb-20 text-lg">
                  We are expanding rapidly to bring seamless mobility to metropolises around the world.
                </p>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cities.map((city, index) => (
                  <AnimatedSection key={city.name} delay={index * 100}>
                    <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-hover group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                          <MapPin size={20} />
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${city.status === 'Live' ? 'bg-green-100 text-green-800' :
                          city.status === 'Beta' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {city.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{city.name}</h3>
                      <p className="text-gray-500 text-sm">{city.rides} daily rides</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="pt-24 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-2xl mb-6">
                    <ShieldCheck size={32} />
                  </div>
                  <h1 className="hero-title mb-6">Uncompromised<br />Safety Standards</h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Every feature, every trip, and every interaction is designed with your security as the foundation.
                  </p>
                </div>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 gap-8 mb-20">
                <AnimatedSection delay={200}>
                  <div className="bg-white border border-black/10 rounded-3xl p-8 h-full hover:border-black/30 transition-colors cursor-hover">
                    <Lock className="mb-6 text-black" size={32} />
                    <h3 className="text-2xl font-bold mb-4">End-to-End Encryption</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Your personal data, location history, and payment information are encrypted with military-grade protocols.
                      We never share your private details with third parties without your explicit consent.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                  <div className="bg-white border border-black/10 rounded-3xl p-8 h-full hover:border-black/30 transition-colors cursor-hover">
                    <Eye className="mb-6 text-black" size={32} />
                    <h3 className="text-2xl font-bold mb-4">Real-Time Monitoring</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Our safety algorithms monitor every trip in real-time. Unusual stops or route deviations trigger
                      automatic check-ins from our 24/7 safety response team.
                    </p>
                  </div>
                </AnimatedSection>
              </div>

              <AnimatedSection delay={600}>
                <div className="bg-black text-white rounded-3xl p-10 md:p-16 text-center">
                  <AlertTriangle className="mx-auto mb-6 text-yellow-400" size={48} />
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Emergency Assistance</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
                    In the unlikely event of an emergency, our in-app SOS button connects you directly to local authorities
                    and shares your live location with your trusted contacts instantly.
                  </p>
                  <button className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors cursor-hover">
                    Learn About SOS Features
                  </button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="pt-28 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-12">
                  <h1 className="text-5xl md:text-6xl font-bold mb-6">
                    About <span className="border-b-4 border-black">RideMate</span>
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    We're not just developers - we're mobility revolutionists! 🚗
                  </p>
                </div>
              </AnimatedSection>

              <div className="space-y-16">
                {/* Our Mission Section */}
                <AnimatedSection delay={150}>
                  <div className="bg-black text-white rounded-3xl p-10 md:p-16">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold">Our Mission</h2>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      To revolutionize urban mobility by creating a seamless, sustainable, and community-driven carpooling platform
                      that reduces traffic congestion, lowers carbon emissions, and makes transportation accessible and affordable for everyone.
                      We believe in the power of shared rides to transform cities and build stronger communities.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                  <div className="bg-black text-white rounded-3xl p-10 md:p-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                          <Shield size={24} className="text-green-400" />
                          Safety First
                        </h3>
                        <p className="text-gray-400">
                          Every decision we make prioritizes the safety and security of our riders and drivers.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                          <Globe size={24} className="text-blue-400" />
                          Sustainability
                        </h3>
                        <p className="text-gray-400">
                          We're committed to reducing our carbon footprint and promoting eco-friendly transportation options.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                          <Zap size={24} className="text-yellow-400" />
                          Innovation
                        </h3>
                        <p className="text-gray-400">
                          Leveraging cutting-edge technology to deliver seamless, efficient mobility solutions.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                          <Users size={24} className="text-purple-400" />
                          Community
                        </h3>
                        <p className="text-gray-400">
                          Building a trusted network of riders and drivers who support and respect each other.
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={700}>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-black border-2 border-white/20 rounded-2xl p-8 text-center hover:shadow-xl hover:border-white/40 transition-all">
                      <h3 className="text-4xl font-bold text-white mb-2">50K+</h3>
                      <p className="text-white/70">Active Users</p>
                    </div>
                    <div className="bg-black border-2 border-white/20 rounded-2xl p-8 text-center hover:shadow-xl hover:border-white/40 transition-all">
                      <h3 className="text-4xl font-bold text-white mb-2">6</h3>
                      <p className="text-white/70">Cities Served</p>
                    </div>
                    <div className="bg-black border-2 border-white/20 rounded-2xl p-8 text-center hover:shadow-xl hover:border-white/40 transition-all">
                      <h3 className="text-4xl font-bold text-white mb-2">1M+</h3>
                      <p className="text-white/70">Rides Completed</p>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Meet Our Team Section */}
                <AnimatedSection delay={800}>
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
                    <p className="text-gray-600 text-lg">The amazing humans behind the magic 🚀</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Jinay Shah */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src="/team/jinay.png" alt="Jinay Shah" className="w-16 h-16 rounded-full object-cover" />
                          <div>
                            <h3 className="text-xl font-bold text-black">Jinay Shah</h3>
                            <p className="text-gray-600 text-sm">Architecting Scalable Solutions</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href="mailto:jinay2910@gmail.com" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </a>
                          <a href="https://www.linkedin.com/in/jinay-shah-a7a842320" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                          </a>
                          <a href="https://github.com/jinay2910" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.23 1.91 1.23 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .314.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        A backend wizard who ensures our APIs are robust and our AI models are cutting-edge. Jinay bridges the gap between complex data and seamless user experiences.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">API</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">AIML</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Cloud</span>
                      </div>
                    </div>

                    {/* Yug Yadav */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src="/team/yug.png" alt="Yug Yadav" className="w-16 h-16 rounded-full object-cover" />
                          <div>
                            <h3 className="text-xl font-bold text-black">Yug Yadav</h3>
                            <p className="text-gray-600 text-sm">Building the Digital Backbone</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href="mailto:yugyadav2510@gmail.com" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </a>
                          <a href="https://www.linkedin.com/in/yug-yadav-b27366248/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                          </a>
                          <a href="https://github.com/yugyadav25" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.23 1.91 1.23 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .314.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        The database guru ensuring data integrity and speed. Yug crafts the high-performance engines that power RideMate's real-time capabilities.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">DBMS</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">React/Node</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">System Design</span>
                      </div>
                    </div>

                    {/* Smit Goyani */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src="/team/smit.png" alt="Smit Goyani" className="w-16 h-16 rounded-full object-cover" />
                          <div>
                            <h3 className="text-xl font-bold text-black">Smit Goyani</h3>
                            <p className="text-gray-600 text-sm">Full-Stack Innovator</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href="mailto:goyanismit04@gmail.com" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </a>
                          <a href="https://www.linkedin.com/in/smit-goyani-541099340/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                          </a>
                          <a href="https://github.com/smitgoyani123" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.23 1.91 1.23 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .314.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Mastering the stack from Django to MongoDB, Smit builds resilient systems that handle thousands of concurrent connections with ease.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Django</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">MongoDB</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Python</span>
                      </div>
                    </div>

                    {/* Tirth Bhatt */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src="/team/tirth.jpg" alt="Tirth Bhatt" className="w-16 h-16 rounded-full object-cover" />
                          <div>
                            <h3 className="text-xl font-bold text-black">Tirth Bhatt</h3>
                            <p className="text-gray-600 text-sm">Designing the Future of Mobility</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href="mailto:bhatttirth18@gmail.com" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </a>
                          <a href="https://linkedin.com/in/tirth-bhatt-748751296" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                          </a>
                          <a href="https://github.com/tirth-bhatt18" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.23 1.91 1.23 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .314.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        With a keen eye for design and a mind for strategy, Tirth shapes the user journey and steers the product vision towards excellence.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">UI/UX</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Management</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Product Strategy</span>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
