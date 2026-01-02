import Game from "@/components/Game";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4 sm:p-8 overflow-hidden relative">
      
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent dark:from-blue-900/20 opacity-70"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-cyan-200 dark:bg-cyan-900/30 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 w-full h-[85vh] sm:h-[800px] max-w-md">
        <Game />
      </div>

      <footer className="mt-8 text-center text-zinc-400 text-sm relative z-10">
        <p>© 2024 Stem Blast. For Kids!</p>
      </footer>
    </main>
  );
}
