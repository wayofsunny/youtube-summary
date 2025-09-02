import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand + Mission */}
        <div>
          <h2 className="text-xl font-bold text-white">Founder’s AI Co-Pilot</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Building the next generation of founder-first AI tools.  
            Our mission is simple: empower entrepreneurs to launch, scale,  
            and succeed with clarity, speed, and confidence.
          </p>
        </div>

        {/* Company Links */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider">Company</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Press</a></li>
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider">Support</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Community</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
            <li><a href="#" className="hover:text-white">Status</a></li>
          </ul>
        </div>

        {/* Legal + Social */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider">Legal</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white">Security</a></li>
          </ul>
          <div className="flex gap-5 mt-6">
            <a href="#" className="hover:text-white"><Github /></a>
            <a href="#" className="hover:text-white"><Twitter /></a>
            <a href="#" className="hover:text-white"><Linkedin /></a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 mt-12 py-6 text-center text-sm text-gray-500">
        © 2025 Founder’s AI Co-Pilot. All rights reserved.  
        Built with ❤️ for the next billion founders.
      </div>
    </footer>
  );
}
