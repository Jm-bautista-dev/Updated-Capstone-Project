<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Operations Gateway | Maki Desu</title>
        
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Noto+Sans+JP:wght@300;500;900&display=swap" rel="stylesheet">

        <!-- Styles -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])

        <style>
            :root {
                --jp-red: #e11d48;
                --sidebar-gray: #f9fafb;
            }

            body {
                font-family: 'Outfit', 'Noto Sans JP', sans-serif;
                background-color: var(--sidebar-gray);
                color: #111827;
            }

            .accent-line {
                width: 3px;
                height: 40px;
                background-color: var(--jp-red);
                border-radius: 99px;
            }

            /* Subtle Sakura Fade */
            .sakura-bg {
                position: fixed;
                top: -10%;
                right: -5%;
                width: 400px;
                height: 400px;
                background: radial-gradient(circle, rgba(225, 29, 72, 0.03) 0%, transparent 70%);
                filter: blur(60px);
                z-index: -1;
            }

            .glass-card {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(229, 231, 235, 0.5);
            }
        </style>
    </head>
    <body class="antialiased selection:bg-rose-100 selection:text-rose-900 min-h-screen flex flex-col">
        <div class="sakura-bg"></div>
        
        <!-- Internal Navigation -->
        <nav class="w-full max-w-7xl mx-auto px-6 py-10 flex justify-between items-center relative z-10">
            <div class="flex items-center gap-4">
                <div class="accent-line"></div>
                <div>
                    <span class="block text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-1 leading-none">Operating System</span>
                    <span class="font-black text-2xl tracking-tighter uppercase italic text-gray-900">Maki <span class="text-rose-600">Desu</span></span>
                </div>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 group cursor-default">
                    <div class="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-emerald-600 transition-colors">Server: Online</span>
                </div>
                @auth
                    <div class="h-4 w-px bg-gray-200"></div>
                    <div class="flex items-center gap-3">
                        <div class="text-right hidden sm:block">
                            <span class="block text-[10px] font-black uppercase tracking-widest text-gray-400">Active Controller</span>
                            <span class="block text-xs font-bold text-gray-900">{{ Auth::user()->name }}</span>
                        </div>
                    </div>
                @endauth
            </div>
        </nav>

        <!-- Main Gateway Interface -->
        <main class="flex-1 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center -mt-20">
            <div class="text-center space-y-8 max-w-3xl">
                <div class="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Internal Access Only</span>
                    <span class="size-1 rounded-full bg-gray-300"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-rose-600">Restricted Zone</span>
                </div>

                <div class="space-y-4">
                    <h1 class="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter italic leading-none animate-in fade-in duration-1000">
                        Welcome to Maki Desu <br/> Operations System
                    </h1>
                    <p class="text-lg text-gray-500 font-medium uppercase tracking-widest text-xs md:text-sm animate-in fade-in delay-300 duration-1000">
                        POS • Inventory • Recipe Costing • Analytics — Staff & Admin Control Panel
                    </p>
                </div>

                <!-- Primary Action -->
                <div class="pt-10 flex flex-col items-center gap-4 animate-in fade-in fill-mode-both delay-500 duration-700">
                    @auth
                        <a href="{{ url('/dashboard') }}" class="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-rose-600 hover:-translate-y-1 transition-all duration-300 group">
                            Enter Dashboard 
                            <svg class="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </a>
                    @else
                        <a href="{{ route('login') }}" class="px-12 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-rose-100 hover:bg-rose-700 hover:-translate-y-1 transition-all duration-300 group">
                            Login
                            <svg class="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </a>
                    @endauth
                </div>
            </div>

            <!-- Module Shortcuts (Internal) -->
            <div class="w-full mt-24 grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-8 delay-700 duration-1000">
                @foreach([
                    ['title' => 'POS Terminal', 'icon' => 'M7 7h10M7 12h10m-10 5h10', 'link' => '/pos'],
                    ['title' => 'Inventory', 'icon' => 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10', 'link' => '/inventory'],
                    ['title' => 'Products', 'icon' => 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01m0-3h.01M12 14h.01', 'link' => '/products'],
                    ['title' => 'Reports', 'icon' => 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'link' => '/reports'],
                    ['title' => 'Control', 'icon' => 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'link' => '/profile']
                ] as $module)
                <a href="{{ url($module['link']) }}" class="glass-card p-6 rounded-3xl flex flex-col items-center gap-4 hover:border-rose-200 hover:-translate-y-1 transition-all duration-300">
                    <div class="size-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:text-rose-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $module['icon'] }}"></path></svg>
                    </div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-500">{{ $module['title'] }}</span>
                </a>
                @endforeach
            </div>
        </main>

        <!-- System Footer -->
        <footer class="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 border-t border-gray-100/50">
            <div class="flex items-center gap-8">
                <div>
                  <span class="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Architecture</span>
                  <span class="block text-[10px] font-bold text-gray-900 uppercase tracking-widest">Internal Build v4.2</span>
                </div>
                <div>
                  <span class="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Security</span>
                  <span class="block text-[10px] font-bold text-gray-900 uppercase tracking-widest italic">L-AES Protocol</span>
                </div>
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Restricted Access • Internal Operational Facility</p>
        </footer>
    </body>
</html>
