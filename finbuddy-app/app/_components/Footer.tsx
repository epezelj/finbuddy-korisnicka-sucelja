export function Footer() {
  return (
    <footer className="bg-[#111827] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-[#2563EB] mb-4 font-extrabold">FinBuddy</div>
            <p className="text-gray-400">
              Simple, intuitive finance tracking for everyone.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Pages</h4>
            <ul className="space-y-2">
              <li><a href="/home" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">App Sections</h4>
            <ul className="space-y-2">
              <li><a href="/transactions" className="text-gray-400 hover:text-white transition-colors">Transactions</a></li>
              <li><a href="/accounts" className="text-gray-400 hover:text-white transition-colors">Accounts</a></li>
              <li><a href="/reports" className="text-gray-400 hover:text-white transition-colors">Reports</a></li>
              <li><a href="/categories" className="text-gray-400 hover:text-white transition-colors">Categories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Resources</h4>
            <ul className="space-y-2">
              <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/settings" className="text-gray-400 hover:text-white transition-colors">Settings</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>© 2026 FinBuddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
