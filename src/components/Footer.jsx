import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-600 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="border-l-2 border-orange-400 pl-4">
            <h3 className="text-gray-900 text-lg font-bold mb-4">About Aira3D</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Transforming ideas into reality through cutting-edge 3D printing technology.
              We specialize in bringing your creative visions to life with precision and quality.
            </p>
          </div>

          <div>
            <h3 className="text-gray-900 text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/custom-order" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Custom Order
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>📧 aira3dprinting@gmail.com</li>
              <li>📍 Aira 3d shegaon buldhana maharashtra, india</li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/robotics_developer/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-600 transition-colors text-2xl">
                📷
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-6">
        <p className="text-gray-500 text-sm text-center">
          © 2026 Aira3D - Transforming Ideas Into Reality Through 3D Printing
        </p>
      </div>
    </footer>
  );
};

export default Footer;





