export function Footer() {
  return (
    <footer className="bg-[#111827] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: side-by-side on sm+ , stacked + centered on mobile */}
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md mx-auto text-center sm:mx-0 sm:text-left">
            <div className="text-[#2563EB] mb-4 font-extrabold">FinBuddy</div>
            <p className="text-gray-400">
              Simple, intuitive finance tracking for everyone.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="mb-4 font-semibold">Pages</h4>
            <ul className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-3">
              <li>
                <a href="/home" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/transactions" className="text-gray-400 hover:text-white transition-colors">
                  Transactions
                </a>
              </li>
              <li>
                <a href="/accounts" className="text-gray-400 hover:text-white transition-colors">
                  Accounts
                </a>
              </li>
              <li>
                <a href="/reports" className="text-gray-400 hover:text-white transition-colors">
                  Reports
                </a>
              </li>
              <li>
                <a href="/categories" className="text-gray-400 hover:text-white transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="/settings" className="text-gray-400 hover:text-white transition-colors">
                  Settings
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>© 2026 FinBuddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
