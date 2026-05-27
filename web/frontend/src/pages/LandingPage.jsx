// pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Activity, 
  Phone,
  Mail,
  MapPin,
  Cloud,
  Thermometer,
  Droplets,
  CheckCircle
} from 'lucide-react'

// Import the logo and sensor image
import bewAirLogo from '../assets/bewair_logo_black.png'
import iotImage from '../assets/IoT.jpg'

const LandingPage = () => {
  const [email, setEmail] = useState('')
  const [activeSection, setActiveSection] = useState('hero')
  const [isScrolled, setIsScrolled] = useState(false)

  const handleNewsletter = (e) => {
    e.preventDefault()
    console.log('Newsletter signup:', email)
    setEmail('')
  }

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 70
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  // Track active section while scrolling
  useEffect(() => {
    const sections = ['hero', 'problem', 'solution', 'features', 'faq']
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetBottom = offsetTop + element.offsetHeight
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'features', label: 'Features' },
    { id: 'faq', label: 'FAQ' },
  ]

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <img src={bewAirLogo} alt="BewAir Logo" className="landing-logo" />
            <h2>BewAir</h2>
          </div>
          
          {/* Desktop Menu */}
          <div className="nav-menu">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-content">
          <h1>Clean Air for <span>Smarter Learning</span></h1>
          <p>A mobile and web application with real-time iot based monitoring and health advisory system</p>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="problem">
        <div className="container">
          <h2>The Problem</h2>
          <p className="section-subtitle"><b>Poor indoor air quality is hurting our children's education</b></p>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-text">Indoor Air Quality (IAQ) refers to the air quality index within buildings and structures. Some sources, such as construction materials, furnishings, and air fresheners, may release toxic fumes, and inadequate ventilation can raise the temperature and humidity levels, which can increase the concentrations of some pollutants. Exposure to these pollutants has been shown to have significant adverse effects on cardiovascular and respiratory diseases. In Manila, community clinics, which are primary healthcare access points, lack the resources to monitor and mitigate air quality health risks within their facilities. Patients frequently visit these clinics to seek treatment, not knowing that the clinics themselves can become hotspots for transmission when the air quality of the environment is ignored.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="solution">
        <div className="container">
          <h2>Introducing BewAir</h2>
          <div className="solution-content">
            <div className="solution-text">
              <p className="section-text">The complete air quality management system for schools</p>
              <p>BewAir combines cutting-edge IoT sensors with an intelligent cloud platform to give schools real-time visibility into their indoor air quality.</p>
              <ul>
                <li><CheckCircle size={20} /> Real-time monitoring of 6+ air quality parameters</li>
                <li><CheckCircle size={20} /> Instant alerts when air quality becomes unsafe</li>
                <li><CheckCircle size={20} /> Easy installation - no technical expertise required</li>
                <li><CheckCircle size={20} /> Scalable from single classroom to entire district</li>
              </ul>
            </div>
            <div className="solution-image">
              <img src={iotImage} alt="IoT Sensor Device" className="iot-sensor-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="product-features">
        <div className="container">
          <h2>What Our Sensors Track</h2>
          <div className="features-grid">
            <div className="feature-card">
              <Activity size={40} />
              <h3>PM2.5</h3>
              <p>Monitor fine particulate matter for air quality assessment</p>
            </div>
            <div className="feature-card">
              <Activity size={40} />
              <h3>PM10</h3>
              <p>Track larger particulate matter that can affect respiratory health</p>
            </div>
            <div className="feature-card">
              <Cloud size={40} />
              <h3>Carbon Monoxide</h3>
              <p>Detect dangerous CO levels for safety compliance</p>
            </div>
            <div className="feature-card">
              <Thermometer size={40} />
              <h3>Temperature</h3>
              <p>Ensure optimal thermal comfort for learning</p>
            </div>
            <div className="feature-card">
              <Droplets size={40} />
              <h3>Humidity</h3>
              <p>Prevent mold growth and maintain comfort levels</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section id="faq" className="faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How many sensors do we need?</h3>
              <p>We recommend 1-2 sensors per classroom depending on size. Contact us for a free consultation.</p>
            </div>
            <div className="faq-item">
              <h3>Is installation complicated?</h3>
              <p>Not at all! Our sensors are plug-and-play and connect to your existing WiFi network.</p>
            </div>
            <div className="faq-item">
              <h3>What about maintenance?</h3>
              <p>Sensors require minimal maintenance. Battery replacement every 6 months is all that's needed.</p>
            </div>
            <div className="faq-item">
              <h3>Sample Question ?</h3>
              <p>Sample Answer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Breathe New Life Into Your School?</h2>
          <p>Join forward-thinking schools already using BewAir to create healthier learning environments.</p>
          <div className="newsletter">
            <p>Subscribe to our newsletter for air quality insights:</p>
            <form onSubmit={handleNewsletter}>
              <input 
                type="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>BewAir</h3>
              <p>A mobile and web application with real-time iot based monitoring and health advisory system</p>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p><Mail size={16} /> NandoSan67@gmail.com</p>
              <p><Phone size={16} /> (63+) 967-6767-676</p>
              <p><MapPin size={16} /> Metro Manila, PH</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('faq')}>FAQ</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 BewAir. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage