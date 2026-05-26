"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'À Propos', href: '/a-propos' },
    { name: 'Tarifs', href: '/tarifs' },
    { name: 'Connexion', href: '/connexion' },
  ]

  return (
    <header className="absolute top-0 w-full z-50 p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white flex items-center gap-2">
          NourAl 🌙
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 text-white font-medium items-center">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="hover:text-accent transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/inscription" 
            className="px-6 py-3 bg-[#F5A623] text-[#1A3A5C] rounded-xl font-extrabold hover:bg-[#F5A623]/90 transition shadow-lg"
          >
            Essai Gratuit
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#1A3A5C] z-40 flex flex-col items-center justify-center gap-8 text-2xl font-bold text-white md:hidden">
          <button 
            className="absolute top-8 right-8"
            onClick={() => setIsOpen(false)}
          >
            <X size={40} />
          </button>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="hover:text-accent"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/inscription" 
            onClick={() => setIsOpen(false)}
            className="px-8 py-4 bg-[#F5A623] text-[#1A3A5C] rounded-2xl font-extrabold shadow-xl mt-4"
          >
            Essai Gratuit
          </Link>
        </div>
      )}
    </header>
  )
}
