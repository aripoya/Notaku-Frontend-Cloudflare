import { useState } from "react";
import {
  Home,
  LogIn,
  FileText,
  Receipt,
  MessageSquare,
  Upload,
  LayoutDashboard,
  Menu,
  X,
  Github,
  BookOpen,
} from "lucide-react";

// Import all example components
import LoginExample from "./LoginExample";
import NotesListExample from "./NotesListExample";
import ReceiptUploadExample from "./ReceiptUploadExample";
import AIChatExample from "./AIChatExample";
import FileUploadExample from "./FileUploadExample";
import DashboardExample from "./DashboardExample";

type ExamplePage =
  | "home"
  | "auth"
  | "notes"
  | "receipts"
  | "chat"
  | "upload"
  | "dashboard";

interface NavItem {
  id: ExamplePage;
  label: string;
  icon: any;
  description: string;
}

/**
 * Main showcase page with navigation between all examples
 * Features: sidebar navigation, responsive design, example routing
 */
export default function ExamplesShowcase() {
  const [currentPage, setCurrentPage] = useState<ExamplePage>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      description: "Overview and introduction",
    },
    {
      id: "auth",
      label: "Authentication",
      icon: LogIn,
      description: "Login and registration",
    },
    {
      id: "notes",
      label: "Notes Management",
      icon: FileText,
      description: "CRUD operations with pagination",
    },
    {
      id: "receipts",
      label: "Receipt OCR",
      icon: Receipt,
      description: "Upload and process receipts",
    },
    {
      id: "chat",
      label: "AI Chat",
      icon: MessageSquare,
      description: "Chat with AI assistant",
    },
    {
      id: "upload",
      label: "File Upload",
      icon: Upload,
      description: "Multi-file upload demo",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Complete dashboard view",
    },
  ];

  const handleNavigation = (page: ExamplePage) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigation} navItems={navItems} />;
      case "auth":
        return <LoginExample />;
      case "notes":
        return <NotesListExample />;
      case "receipts":
        return <ReceiptUploadExample />;
      case "chat":
        return <AIChatExample />;
      case "upload":
        return <FileUploadExample />;
      case "dashboard":
        return <DashboardExample />;
      default:
        return <HomePage onNavigate={handleNavigation} navItems={navItems} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Notaku Examples
          </h1>
          <p className="text-sm text-slate-600 mt-1">API Integration Demos</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? "text-blue-900" : "text-slate-900"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <a
            href="https://github.com/notaku/frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
          <a
            href="/docs/API_INTEGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Notaku Examples
          </h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

/**
 * Home Page Component
 */
function HomePage({
  onNavigate,
  navItems,
}: {
  onNavigate: (page: ExamplePage) => void;
  navItems: NavItem[];
}) {
  const features = [
    {
      title: "Type-Safe",
      description: "Full TypeScript support with strict types",
      icon: "🔒",
    },
    {
      title: "Modern UI",
      description: "Beautiful design with Tailwind CSS",
      icon: "🎨",
    },
    {
      title: "Accessible",
      description: "ARIA labels and keyboard navigation",
      icon: "♿",
    },
    {
      title: "Production Ready",
      description: "Error handling and loading states",
      icon: "✅",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            API Integration Examples
          </div>

          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Notaku Examples
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Comprehensive examples demonstrating integration with the Notaku
            Backend API. Explore authentication, CRUD operations, file uploads,
            AI chat, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("auth")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            <a
              href="/docs/API_INTEGRATION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-50 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all font-semibold text-lg"
            >
              View Documentation
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Explore Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navItems.slice(1).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {item.label}
                  </h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Built With
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">⚛️</div>
              <p className="font-semibold text-slate-900">React 18</p>
              <p className="text-xs text-slate-600">UI Framework</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📘</div>
              <p className="font-semibold text-slate-900">TypeScript</p>
              <p className="text-xs text-slate-600">Type Safety</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎨</div>
              <p className="font-semibold text-slate-900">Tailwind CSS</p>
              <p className="text-xs text-slate-600">Styling</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🚀</div>
              <p className="font-semibold text-slate-900">FastAPI</p>
              <p className="text-xs text-slate-600">Backend API</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-slate-600">
          <p>
            Made with ❤️ for Notaku Platform •{" "}
            <a
              href="https://api.notaku.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              API Documentation
            </a>
          </p>
          <p className="mt-2">
            Backend: Jakarta, Indonesia 🇮🇩 • All data stays in Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}
