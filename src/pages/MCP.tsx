
import MCPPanel from '@/components/MCP/MCPPanel';

export default function MCPPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">MCP Protocol Integration</h1>
          <p className="text-gray-600">
            Connect to Model Context Protocol servers to enhance your writing with external AI tools and resources.
          </p>
        </div>
        
        <MCPPanel />
        
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">About MCP Integration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📚 Resources</h3>
              <p className="text-sm text-blue-700">
                Access external knowledge bases, documentation, and content libraries to enhance your writing context.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🛠️ Tools</h3>
              <p className="text-sm text-green-700">
                Use AI-powered tools for grammar checking, style analysis, plot generation, and character development.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">💭 Prompts</h3>
              <p className="text-sm text-purple-700">
                Access curated writing prompts and templates for different genres and writing styles.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">🔄 Real-time</h3>
              <p className="text-sm text-orange-700">
                Real-time synchronization with external servers for live collaboration and dynamic content updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
