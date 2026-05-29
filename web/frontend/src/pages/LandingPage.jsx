import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import bewairLogo from '../assets/bewair_logo_black.png';
import bewairLogoWhite from '../assets/bewair_logo_white.png';
import {
  Activity,
  Phone,
  Mail,
  MapPin,
  Cloud,
  Thermometer,
  Droplets,
  AlertTriangle,
  Wind,
  ArrowRight,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
    alert('Thank you for subscribing!');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['hero', 'problem', 'solution', 'features', 'faq'];
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 70;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'features', label: 'Features' },
    { id: 'faq', label: 'FAQ' },
  ];

 const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

  return (
    <div className="landing-page">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          width: 100%;
          overflow-x: hidden;
          background: white;
        }

        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255,255,255,0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(226,232,240,0.7);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .nav.scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-logo-img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .nav-title {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.3s;
          position: relative;
          padding: 0.5rem 0;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #2563eb;
        }

        .nav-link-indicator {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #2563eb;
        }

        .nav-cta {
          padding: 10px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .nav-cta:hover {
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
          transform: scale(1.05);
        }

        .nav-cta-login {
          background: transparent;
          color: #2563eb;
          border: 2px solid #2563eb;
        }

        .nav-cta-login:hover {
          background: #2563eb;
          color: white;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }

        /* Hero Section */
        .hero {
  min-height: 100vh;
  padding: 100px 2rem 80px;
  background:
    radial-gradient(circle at top left, rgba(59,130,246,0.15), transparent 35%),
    radial-gradient(circle at top right, rgba(139,92,246,0.12), transparent 35%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

        .blob-container {
          position: absolute;
          inset: 0;
          opacity: 0.3;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          mix-blend-mode: multiply;
          animation: blob 7s infinite;
        }

        .blob-1 {
          top: 80px;
          left: 40px;
          width: 300px;
          height: 300px;
          background: #60a5fa;
        }

        .blob-2 {
          top: 160px;
          right: 40px;
          width: 300px;
          height: 300px;
          background: #a78bfa;
          animation-delay: 2s;
        }

        .blob-3 {
          bottom: -32px;
          left: 50%;
          width: 300px;
          height: 300px;
          background: #f9a8d4;
          animation-delay: 4s;
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        .hero-content {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: #2563eb;
          margin-bottom: 24px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .hero-title {
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 28px;
  color: #0f172a;
}

        .hero-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 56px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 30px;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  border-radius: 14px;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(37,99,235,0.25);
}

        .btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(37,99,235,0.35);
}

        .btn-secondary {
          padding: 16px 32px;
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          border-color: #2563eb;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 48px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.5);
  padding: 2rem;
  border-radius: 24px;
  box-shadow:
    0 10px 30px rgba(15,23,42,0.08),
    inset 0 1px 1px rgba(255,255,255,0.6);
  transition: all 0.35s ease;
}

        .stat-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 20px 50px rgba(15,23,42,0.12),
    inset 0 1px 1px rgba(255,255,255,0.8);
}

        .stat-icon {
          margin: 0 auto 12px;
          color: #2563eb;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        /* Section Styles */
        .section {
          padding: 80px 2rem;
        }

        .section-white {
          background: white;
        }

        .section-gray {
          background: linear-gradient(135deg, #f9fafb 0%, #dbeafe 100%);
        }

        .section-purple {
          background: linear-gradient(135deg, #f9fafb 0%, #f3e8ff 100%);
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 64px;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #fef2f2;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: #dc2626;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 20px;
          color: #6b7280;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Problem Section */
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 2rem;
        }

        .problem-card {
          background: linear-gradient(135deg, #fef2f2 0%, #fed7aa 100%);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .problem-card-blue {
          background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%);
        }

        .problem-card h3 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .problem-card p {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .problem-list {
          list-style: none;
        }

        .problem-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #374151;
          margin-bottom: 12px;
        }

        .problem-icon {
          color: #ef4444;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 24px;
        }

        .mini-stat {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .mini-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
        }

        .mini-stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        /* Solution Section */
        .solution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 3rem;
          align-items: center;
        }

        .solution-text p {
          font-size: 18px;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
        }

        .feature-item:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .feature-icon-box {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-item h4 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .feature-item p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .solution-visual {
          background: linear-gradient(135deg, #bfdbfe 0%, #ddd6fe 100%);
          border-radius: 16px;
          padding: 3rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .visual-circle-1 {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 160px;
          height: 160px;
          background: #60a5fa;
          border-radius: 50%;
          opacity: 0.5;
        }

        .visual-circle-2 {
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 160px;
          height: 160px;
          background: #a78bfa;
          border-radius: 50%;
          opacity: 0.5;
        }

        .visual-icon-box {
          position: relative;
          z-index: 10;
          width: 128px;
          height: 128px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .visual-title {
          position: relative;
          z-index: 10;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .visual-subtitle {
          position: relative;
          z-index: 10;
          color: #6b7280;
        }

        /* Features Section */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .feature-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid #f3f4f6;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .feature-card:hover {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }

        .feature-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }

        .gradient-red { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); }
        .gradient-orange { background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); }
        .gradient-gray { background: linear-gradient(135deg, #4b5563 0%, #1f2937 100%); }
        .gradient-pink { background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%); }
        .gradient-blue { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); }
        .gradient-purple { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
          text-align: center;
          width: 100%;
        }

        .feature-card p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          text-align: center;
          width: 100%;
        }

        /* FAQ Section */
        .faq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
          gap: 1.5rem;
        }

        .faq-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
        }

        .faq-card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .faq-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }

        .faq-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta {
          padding: 80px 2rem;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .cta-blur-container {
          position: absolute;
          inset: 0;
          opacity: 0.1;
        }

        .cta-blur-1 {
          position: absolute;
          top: 0;
          left: 25%;
          width: 400px;
          height: 400px;
          background: white;
          border-radius: 50%;
          filter: blur(100px);
        }

        .cta-blur-2 {
          position: absolute;
          bottom: 0;
          right: 25%;
          width: 400px;
          height: 400px;
          background: white;
          border-radius: 50%;
          filter: blur(100px);
        }

        .cta-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .cta h2 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .cta p {
          font-size: 20px;
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .newsletter-box {
          max-width: 500px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .newsletter-box p {
          font-size: 18px;
          margin-bottom: 16px;
        }

        .newsletter-form {
          display: flex;
          gap: 12px;
        }

        .newsletter-input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          outline: none;
        }

        .newsletter-input:focus {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
        }

        .newsletter-btn {
          padding: 12px 24px;
          background: white;
          color: #2563eb;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s;
        }

        .newsletter-btn:hover {
          background: #f3f4f6;
        }

        /* Footer */
        .footer {
          background: #111827;
          color: white;
          padding: 64px 2rem 32px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 3rem;
          margin-bottom: 48px;
        }

        .footer-section h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .footer-section h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .footer-section p {
          color: #9ca3af;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9ca3af;
          text-decoration: none;
          transition: color 0.3s;
          margin-bottom: 12px;
        }

        .footer-link:hover {
          color: white;
        }

        .footer-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          display: block;
          margin-bottom: 8px;
          text-align: left;
          transition: color 0.3s;
          text-transform: capitalize;
        }

        .footer-btn:hover {
          color: white;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid #374151;
          color: #9ca3af;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .footer-logo-img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .hero-title {
            font-size: 40px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .section-title {
            font-size: 36px;
          }

          .problem-grid,
          .solution-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }

          .newsletter-form {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className={`nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <img src={bewairLogo} alt="BewAir" className="nav-logo-img" />
            <h2 className="nav-title">BewAir</h2>
          </div>

          <div className="nav-links">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
  layoutId="activeSection"
  className="nav-link-indicator"
  transition={{
    type: "spring",
    stiffness: 380,
    damping: 30
  }}
/>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="blob-container">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <div className="hero-content">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="hero-badge">
              <Shield size={16} />
              <span>Trusted by Schools Nationwide</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="hero-title">
              Clean Air for{' '}
              <span className="hero-gradient">Smarter Learning</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="hero-subtitle">
              Real-time IoT-based air quality monitoring and health advisory system for schools and educational institutions
            </motion.p>

            <motion.div variants={fadeInUp} className="hero-buttons">
              <button onClick={() => scrollToSection('solution')} className="btn-primary">
                Explore BewAir
                <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection('features')} className="btn-secondary">
                View Features
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="hero-stats">
              {[
                { icon: Shield, value: '99.9%', label: 'Uptime Reliability' },
                { icon: Zap, value: '< 1s', label: 'Real-time Updates' },
                { icon: BarChart3, value: '6+', label: 'Air Quality Metrics' }
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <stat.icon size={40} className="stat-icon" />
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="section section-white">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="section-header"
          >
            <motion.div variants={fadeInUp} className="section-badge">
              <AlertTriangle size={16} />
              <span>A Growing Health Crisis</span>
            </motion.div>

            <motion.h2 variants={fadeInUp} className="section-title">
              The Problem We're Solving
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">
              Poor indoor air quality is silently affecting our children's health and education
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="problem-grid"
          >
            <motion.div variants={fadeInUp} className="problem-card">
              <h3>The Silent Threat</h3>
              <p>
                Indoor Air Quality (IAQ) refers to the air quality within buildings. Poor ventilation, construction materials, and inadequate monitoring can create toxic environments that significantly impact cardiovascular and respiratory health.
              </p>
              <ul className="problem-list">
                {[
                  'Toxic fumes from furnishings and materials',
                  'Inadequate ventilation systems',
                  'Elevated temperature and humidity',
                  'Increased pollutant concentrations'
                ].map((item, i) => (
                  <li key={i}>
                    <AlertTriangle size={20} className="problem-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="problem-card problem-card-blue">
              <h3>Impact on Education</h3>
              <p>
                In Metro Manila, schools and clinics lack resources to monitor air quality. Students and patients unknowingly expose themselves to health risks in poorly ventilated environments.
              </p>
              <div className="stats-grid">
                {[
                  { value: '80%', label: 'of time spent indoors' },
                  { value: '30%', label: 'drop in focus from poor IAQ' },
                  { value: '2x', label: 'higher illness rates' },
                  { value: '60%', label: 'schools unmonitored' }
                ].map((stat, i) => (
                  <div key={i} className="mini-stat">
                    <div className="mini-stat-value">{stat.value}</div>
                    <div className="mini-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="section section-gray">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="section-header"
          >
            <motion.h2 variants={fadeInUp} className="section-title">
              Introducing BewAir
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">
              The complete air quality management system for educational institutions
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="solution-grid"
          >
            <motion.div variants={fadeInUp} className="solution-text">
              <p>
                BewAir combines cutting-edge IoT sensors with an intelligent cloud platform to give schools real-time visibility into their indoor air quality, enabling proactive health protection.
              </p>

              <div className="feature-list">
                {[
                  { icon: Activity, title: 'Real-time Monitoring', desc: 'Track 6+ air quality parameters continuously' },
                  { icon: AlertTriangle, title: 'Instant Alerts', desc: 'Get notified when air quality becomes unsafe' },
                  { icon: Zap, title: 'Easy Installation', desc: 'No technical expertise required - plug and play' },
                  { icon: BarChart3, title: 'Scalable Solution', desc: 'From single classroom to entire district' }
                ].map((feature, i) => (
                  <div key={i} className="feature-item">
                    <div className="feature-icon-box">
                      <feature.icon size={24} color="white" />
                    </div>
                    <div>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="solution-visual">
              <div className="visual-circle-1" />
              <div className="visual-circle-2" />

              <div className="visual-icon-box">
                <Wind size={64} color="#2563eb" />
              </div>
              <h3 className="visual-title">IoT Sensor Device</h3>
              <p className="visual-subtitle">Smart monitoring technology for healthier spaces</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section section-white">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="section-header"
          >
            <motion.h2 variants={fadeInUp} className="section-title">
              What Our Sensors Track
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">
              Comprehensive monitoring for complete air quality insights
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="features-grid"
          >
            {[
              { icon: Activity, title: 'PM2.5', desc: 'Monitor fine particulate matter that can penetrate deep into lungs', color: 'gradient-red' },
              { icon: Activity, title: 'PM10', desc: 'Track larger particles that affect respiratory health', color: 'gradient-orange' },
              { icon: Cloud, title: 'Carbon Monoxide', desc: 'Detect dangerous CO levels for safety compliance', color: 'gradient-gray' },
              { icon: Thermometer, title: 'Temperature', desc: 'Ensure optimal thermal comfort for learning', color: 'gradient-pink' },
              { icon: Droplets, title: 'Humidity', desc: 'Prevent mold growth and maintain comfort levels', color: 'gradient-blue' },
              { icon: Wind, title: 'Air Pressure', desc: 'Monitor atmospheric conditions for comfort', color: 'gradient-purple' }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp} className="feature-card">
                <div className={`feature-card-icon ${feature.color}`}>
                  <feature.icon size={28} color="white" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section section-purple">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="section-header"
          >
            <motion.h2 variants={fadeInUp} className="section-title">
              Frequently Asked Questions
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">
              Everything you need to know about BewAir
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="faq-grid"
          >
            {[
              {
                q: 'How many sensors do we need?',
                a: 'We recommend 1-2 sensors per classroom depending on size. Contact us for a free consultation tailored to your facility.'
              },
              {
                q: 'Is installation complicated?',
                a: 'Not at all! Our sensors are plug-and-play and connect to your existing WiFi network. Setup takes less than 5 minutes.'
              },
              {
                q: 'What about maintenance?',
                a: 'Sensors require minimal maintenance. Battery replacement every 6 months and occasional cleaning is all that\'s needed.'
              },
              {
                q: 'How accurate are the readings?',
                a: 'Our sensors use medical-grade components with ±5% accuracy, calibrated to international air quality standards.'
              }
            ].map((faq, i) => (
              <motion.div key={i} variants={fadeInUp} className="faq-card">
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta">
        <div className="cta-blur-container">
          <div className="cta-blur-1" />
          <div className="cta-blur-2" />
        </div>

        <div className="cta-content">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>
              Ready to Breathe New Life Into Your School?
            </motion.h2>
            <motion.p variants={fadeInUp}>
              Join forward-thinking institutions already using BewAir to create healthier learning environments.
            </motion.p>

            <motion.div variants={fadeInUp} className="newsletter-box">
              <p>Subscribe for air quality insights:</p>
              <form onSubmit={handleNewsletter} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <img src={bewairLogoWhite} alt="BewAir" className="footer-logo-img" />
                <h3>BewAir</h3>
              </div>
              <p>
                Real-time IoT-based air quality monitoring and health advisory system for educational institutions.
              </p>
            </div>

            <div>
              <h4>Contact</h4>
              <a href="mailto:NandoSan67@gmail.com" className="footer-link">
                <Mail size={20} />
                <span>NandoSan67@gmail.com</span>
              </a>
              <a href="tel:+639676767676" className="footer-link">
                <Phone size={20} />
                <span>(63+) 967-6767-676</span>
              </a>
              <div className="footer-link">
                <MapPin size={20} />
                <span>Metro Manila, PH</span>
              </div>
            </div>

            <div>
              <h4>Quick Links</h4>
              {['features', 'faq', 'solution'].map((link) => (
                <button
                  key={link}
                  onClick={() => scrollToSection(link)}
                  className="footer-btn"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 BewAir. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
