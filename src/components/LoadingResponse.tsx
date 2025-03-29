const LoadingResponse = () => {
  return (
    <div className="flex justify-start">
  <div className="max-w-xs lg:max-w-md px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50">
    <div className="flex items-center space-x-3">
      {/* Animated dots with gradient colors */}
      <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-bounce"></div>
    </div>
    <p className="mt-2 text-xs text-gray-500 font-medium">AI is thinking...</p>
  </div>
</div>
  )
}

export default LoadingResponse