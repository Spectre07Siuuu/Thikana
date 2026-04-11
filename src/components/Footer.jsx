import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Shield, ChevronRight, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import Logo from './Logo'

const COLS = [
  {
    title: 'Properties',
    links: ['Rent a Flat', 'Buy Property', 'List Your Property', 'Commercial Spaces', 'Land & Plots'],
  },
  {
    title: 'Marketplace',
    links: ['Home Appliances', 'Furniture', 'Kitchen & Dining', 'Home Décor', 'Moving Services'],
  },
  {
    title: 'Company',
    links: ['About Thikana', 'How It Works', 'Careers', 'Press & Media', 'Contact Us'],
  },
]

const SOCIAL = [
  { Icon: Facebook,  label: 'Facebook' },
  { Icon: Twitter,   label: 'Twitter' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Linkedin,  label: 'LinkedIn' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 w-fit">
              <Logo size={32} />
              <span className="text-lg font-extrabold text-gray-900 dark:text-white">Thikana</span>
            </Link>

            {/* Updated description */}
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5 max-w-xs">
              This website is made in Software Engineering Lab by the Team — <span className="font-semibold text-gray-700 dark:text-gray-300">The Full Stop</span>.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-5">
              <a href="tel:01785811263"
                className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400
                  hover:text-orange-500 text-sm transition-colors group">
                <Phone size={13} className="text-orange-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                01785811263
              </a>
              <a href="mailto:msazzad223236@bscse.uiu.ac.bd"
                className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400
                  hover:text-orange-500 text-sm transition-colors group break-all">
                <Mail size={13} className="text-orange-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                msazzad223236@bscse.uiu.ac.bd
              </a>
              <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 text-sm">
                <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                United International University
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400
                    flex items-center justify-center text-gray-400 transition-all duration-200">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-gray-800 dark:text-gray-200 font-bold text-xs uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map(label => (
                  <li key={label}>
                    <a href="#"
                      className="group flex items-center gap-1 text-gray-500 dark:text-gray-400
                        hover:text-orange-500 text-sm transition-colors">
                      <ChevronRight size={12}
                        className="opacity-0 group-hover:opacity-100 -ml-1 text-orange-400 transition-all" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row
          items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
            <Shield size={13} /> NID Verified Listings · Secure Payments
          </div>
          <p className="text-gray-400 text-xs">
            © {year} Thikana — Team The Full Stop. All rights reserved.
          </p>
          <div className="flex gap-4 text-gray-400 text-xs">
            <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
