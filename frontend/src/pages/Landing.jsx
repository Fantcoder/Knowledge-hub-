import React, { useEffect, useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Brain, FileText, Activity, Zap, Shield, Wifi, WifiOff, Moon, Sun, Menu, X, Check, Search, Maximize2, Paperclip, Link as LinkIcon, Download, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Helper Components ---

const Typewriter = ({ texts }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        if (subIndex === texts[index].length + 1 && !reverse) {
            setTimeout(() => setReverse(true), 1500);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % texts.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 50 : 100, parseInt(Math.random() * 50)));

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, texts]);

    useEffect(() => {
        const timeout2 = setInterval(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearInterval(timeout2);
    }, []);

    return (
        <span className="text-ink-muted">
            {texts[index].substring(0, subIndex)}
            <span className={`${blink ? 'opacity-100' : 'opacity-0'} transition-opacity text-accent`}>|</span>
        </span>
    );
};

const AnimatedCounter = ({ value, label, prefix = "", suffix = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isInView) {
            let start = 0;
            // if value is NaN (like '∞'), just set it immediately
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
                setCount(value);
                return;
            }
            
            const duration = 2000;
            const increment = numValue / (duration / 16);
            
            const timer = setInterval(() => {
                start += increment;
                if (start >= numValue) {
                    clearInterval(timer);
                    setCount(numValue);
                } else {
                    setCount(Math.ceil(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return (
        <div ref={ref} className="text-center flex flex-col items-center">
            <div className="font-serif text-5xl md:text-6xl text-ink font-bold mb-2 tracking-tight">
                {prefix}{count}{suffix}
            </div>
            <div className="text-sm font-mono tracking-widest text-ink-faint uppercase">{label}</div>
        </div>
    );
};

// --- Main Page Component ---

export default function Landing() {
    const { isAuthenticated } = useAuth();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Theme toggle
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // Scroll listener for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // navbar height
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    return (
        <div className="min-h-screen bg-surface-0 overflow-x-hidden selection:bg-accent selection:text-accent-ink">
            {/* Ambient Aurora + Particles Background */}
            <div className="bg-aurora fixed inset-0 z-0 pointer-events-none"></div>
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute rounded-full bg-accent/20 blur-xl"
                        style={{
                            width: Math.random() * 200 + 50 + 'px',
                            height: Math.random() * 200 + 50 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animation: `drift ${Math.random() * 20 + 20}s infinite alternate ease-in-out`,
                            animationDelay: `-${Math.random() * 20}s`
                        }}
                    />
                ))}
            </div>

            {/* 1. Scroll-Aware Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-surface-1/70 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent py-2'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent text-accent-ink font-bold shadow-inner">K</div>
                        <span className="font-serif text-xl text-ink tracking-tight">knowledge</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollTo('features')} className="text-sm font-medium text-ink-muted hover:text-ink transition-colors">Features</button>
                        <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-ink-muted hover:text-ink transition-colors">How It Works</button>
                        <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-ink-muted hover:text-ink transition-colors">FAQ</button>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/login" className="btn-ghost py-1.5 px-4 text-sm font-medium">Sign in</Link>
                        <Link to="/register" className="btn-primary py-2 px-5 text-sm shadow-md shadow-accent/20">Get Started</Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 text-ink-muted"><Sun size={18} className={theme === 'light' ? 'hidden' : 'block'} /><Moon size={18} className={theme === 'dark' ? 'hidden' : 'block'} /></button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-ink">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 top-[72px] z-40 bg-surface-0/95 backdrop-blur-xl border-b border-border md:hidden p-6 flex flex-col gap-6"
                    >
                        <button onClick={() => scrollTo('features')} className="text-xl font-serif text-ink text-left pb-4 border-b border-border/50">Features</button>
                        <button onClick={() => scrollTo('how-it-works')} className="text-xl font-serif text-ink text-left pb-4 border-b border-border/50">How It Works</button>
                        <button onClick={() => scrollTo('faq')} className="text-xl font-serif text-ink text-left pb-4 border-b border-border/50">FAQ</button>
                        
                        <div className="flex flex-col gap-4 mt-8">
                            <Link to="/login" className="btn-secondary w-full py-4 text-base justify-center">Sign In</Link>
                            <Link to="/register" className="btn-primary w-full py-4 text-base justify-center">Get Started Free</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Hero Section */}
            <section className="pt-48 pb-20 px-6 flex flex-col items-center justify-center min-h-[95vh] text-center relative z-10">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl flex flex-col items-center">
                    <motion.div variants={fadeUp} className="px-4 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-mono text-ink-muted mb-8 tracking-wide shadow-sm">
                        ✨ V1.0 IS NOW LIVE
                    </motion.div>
                    <motion.h1 variants={fadeUp} className="font-serif text-5xl sm:text-6xl md:text-8xl text-ink leading-[1.1] mb-6">
                        Your private space <br />
                        <Typewriter texts={["for your notes & ideas", "for your links & files", "to organize everything", "powered by local AI"]} />
                    </motion.h1>
                    <motion.p variants={fadeUp} className="text-lg md:text-xl text-ink-faint mb-12 max-w-2xl leading-relaxed">
                        Knowledge Hub is a secure, offline-ready second brain. Capture thoughts, visualize connections, and chat with your notes using AI.
                    </motion.p>
                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
                        <Link to="/register" className="btn-primary w-full sm:w-auto px-8 py-4 text-base shadow-2xl shadow-accent/25 hover:shadow-accent/40 group relative overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">Start for free <span className="group-hover:translate-x-1 transition-transform">→</span></span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </Link>
                    </motion.div>

                    {/* Animated Stats Bar */}
                    <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-ink-muted">
                        <span className="flex items-center gap-2"><Check size={16} className="text-accent" /> Free forever</span>
                        <span className="flex items-center gap-2"><Shield size={16} className="text-accent" /> End-to-end private</span>
                        <span className="flex items-center gap-2"><WifiOff size={16} className="text-accent" /> Offline-ready</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Social Proof / Trust Strip (Marquee) */}
            <section className="py-10 border-y border-border bg-surface-1/30 backdrop-blur-md relative z-10 overflow-hidden flex items-center">
                <div className="px-6 text-2xs font-mono uppercase tracking-widest text-ink-ghost shrink-0 border-r border-border mr-8 py-2">Powered By</div>
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex gap-16 items-center w-max animate-[marquee_30s_linear_infinite] opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {['React 18', 'Spring Boot 3', 'PostgreSQL', 'Groq AI', 'LLaMA 3.3', 'Vite', 'Tailwind', 'Dexie.js', 'React 18', 'Spring Boot 3', 'PostgreSQL'].map((tech, i) => (
                            <span key={i} className="font-sans font-bold text-lg text-ink-muted tracking-tight">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Feature Deep-Dives */}
            <section id="features" className="py-32 px-6 max-w-6xl mx-auto relative z-10 space-y-32">
                <div className="text-center mb-24">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-serif text-4xl md:text-5xl text-ink">Work at the speed of thought</motion.h2>
                </div>

                {/* Deep Dive 1: AI Chat */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="flex-1 space-y-6">
                        <motion.div variants={fadeUp} className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Brain size={24} /></motion.div>
                        <motion.h3 variants={fadeUp} className="font-serif text-3xl text-ink">Talk to your second brain</motion.h3>
                        <motion.p variants={fadeUp} className="text-ink-faint text-lg leading-relaxed">
                            Don't just search your notes—have a conversation with them. Our AI reads your knowledge base and synthesizes answers instantly.
                        </motion.p>
                        <motion.ul variants={fadeUp} className="space-y-3 pt-4 font-medium text-ink-muted">
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Natural language Q&A</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Exact source citations</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Instant streaming responses</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Powered by LLaMA 3.3 70B</li>
                        </motion.ul>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex-1 w-full relative">
                        <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full"></div>
                        <div className="card p-6 bg-surface-1/80 backdrop-blur-xl border border-border/60 shadow-2xl relative z-10 rounded-2xl flex flex-col gap-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="self-end bg-accent text-accent-ink px-4 py-2 rounded-2xl rounded-tr-sm text-sm shadow-md">How does React context work?</div>
                            <div className="self-start bg-surface-2 text-ink px-4 py-3 rounded-2xl rounded-tl-sm text-sm border border-border relative overflow-hidden w-11/12 shadow-sm">
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(217,119,6,0.1),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_infinite_linear]"></div>
                                Based on your notes, React Context provides a way to pass data through the component tree without having to pass props down manually at every level.
                                <div className="mt-3 pt-2 border-t border-border/50 flex gap-2">
                                    <span className="text-2xs px-2 py-1 bg-surface-3 rounded-md text-ink-faint font-mono">📄 React Basics (98%)</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Deep Dive 2: Editor (Image Left, Text Right) */}
                <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
                    <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex-1 w-full relative">
                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                        <div className="card p-6 bg-surface-1/80 backdrop-blur-xl border border-border/60 shadow-2xl relative z-10 rounded-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="h-6 flex items-center gap-1.5 mb-4 border-b border-border/50 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <h4 className="font-serif text-2xl text-ink mb-2">Project Ideas 2025</h4>
                            <p className="text-ink-muted text-sm mb-4">A list of things to build this year.</p>
                            <div className="bg-surface-2 p-2 rounded-lg text-sm text-ink-faint border border-border mb-2 font-mono flex items-center gap-2">
                                <span className="bg-surface-3 px-1 rounded text-ink">/</span> Type '/' for commands
                            </div>
                            <ul className="space-y-2 mt-4 text-sm text-ink-muted">
                                <li className="flex items-center gap-2"><input type="checkbox" readOnly className="rounded border-border accent-accent" checked/> Launch Knowledge Hub</li>
                                <li className="flex items-center gap-2"><input type="checkbox" readOnly className="rounded border-border accent-accent"/> Write documentation</li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="flex-1 space-y-6">
                        <motion.div variants={fadeUp} className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><FileText size={24} /></motion.div>
                        <motion.h3 variants={fadeUp} className="font-serif text-3xl text-ink">A beautiful writing experience</motion.h3>
                        <motion.p variants={fadeUp} className="text-ink-faint text-lg leading-relaxed">
                            A block-based editor that gets out of your way. Type '/' to insert lists, code blocks, and headings instantly.
                        </motion.p>
                        <motion.ul variants={fadeUp} className="space-y-3 pt-4 font-medium text-ink-muted">
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Notion-style slash commands</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Floating format menu</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Syntax highlighted code blocks</li>
                            <li className="flex items-center gap-3"><Check size={18} className="text-accent" /> Autosaved offline</li>
                        </motion.ul>
                    </motion.div>
                </div>

                {/* Deep Dive 3: Graph (Centered) */}
                <div className="flex flex-col items-center text-center gap-12 pt-16">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="max-w-2xl space-y-6">
                        <motion.div variants={fadeUp} className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mx-auto"><Activity size={24} /></motion.div>
                        <motion.h3 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-ink">See the big picture</motion.h3>
                        <motion.p variants={fadeUp} className="text-ink-faint text-lg leading-relaxed">
                            Your knowledge isn't linear. Discover unexpected connections between your notes, links, and tags through a dynamic force-directed graph.
                        </motion.p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="w-full max-w-4xl h-64 md:h-96 relative card border border-border/50 bg-surface-1 overflow-hidden flex items-center justify-center">
                        {/* CSS mock graph */}
                        <div className="absolute w-full h-full opacity-60 mix-blend-screen">
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_var(--accent)] animate-pulse"></div>
                            <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-[drift_4s_infinite_alternate]"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-[drift_5s_infinite_alternate_reverse]"></div>
                            <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-[drift_6s_infinite_alternate]"></div>
                            
                            {/* Lines connecting them */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                <line x1="50%" y1="50%" x2="25%" y2="33%" stroke="currentColor" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="75%" y2="66%" stroke="currentColor" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="66%" y2="25%" stroke="currentColor" strokeWidth="1" />
                                <line x1="25%" y1="33%" x2="66%" y2="25%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 5. More Features Grid */}
            <section className="py-24 px-6 max-w-6xl mx-auto relative z-10 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { icon: Zap, title: "Quick Capture", desc: "Hit Ctrl+Shift+K to instantly capture a thought from anywhere." },
                        { icon: Search, title: "Command Palette", desc: "Press Ctrl+K to search all notes, files, and tags instantly." },
                        { icon: Maximize2, title: "Zen Mode", desc: "Fullscreen distraction-free writing environment." },
                        { icon: Paperclip, title: "File Uploads", desc: "Attach PDFs, images, and documents directly to notes." },
                        { icon: LinkIcon, title: "Link Vault", desc: "Save web bookmarks with automatic metadata extraction." },
                        { icon: Download, title: "Data Export", desc: "One-click export of everything to JSON or Markdown." }
                    ].map((feature, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-5 group hover:border-accent/40 transition-colors cursor-default">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 rounded-lg bg-surface-2 text-ink-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors"><feature.icon size={18} /></div>
                                <h4 className="font-serif text-lg text-ink">{feature.title}</h4>
                            </div>
                            <p className="text-sm text-ink-faint">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 6. How It Works (Animated Flow) */}
            <section id="how-it-works" className="py-32 px-6 bg-surface-1/30 border-y border-border relative z-10 overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-24">
                        <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted block mb-3">Workflow</span>
                        <h2 className="font-serif text-4xl text-ink">Built for flow state</h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between relative gap-12 md:gap-4">
                        {/* Animated Line connecting steps */}
                        <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-border z-0">
                            <motion.div 
                                initial={{ scaleX: 0, transformOrigin: "left" }} 
                                whileInView={{ scaleX: 1 }} 
                                viewport={{ once: true, margin: "-100px" }} 
                                transition={{ duration: 1.5, ease: "easeInOut" }} 
                                className="h-full bg-accent" 
                            />
                        </div>

                        {[
                            { num: "1", title: "Capture", desc: "Jot down ideas instantly before you forget them." },
                            { num: "2", title: "Organize", desc: "Tag, pin, and link notes to build structure naturally." },
                            { num: "3", title: "Synthesize", desc: "Ask the AI to connect the dots and generate insights." }
                        ].map((step, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.3 + 0.5 }} className="flex-1 relative z-10 flex flex-col items-center text-center">
                                <motion.div 
                                    whileInView={{ boxShadow: "0 0 20px var(--accent)" }} 
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.3 + 0.8, duration: 0.5 }}
                                    className="w-24 h-24 rounded-full bg-surface-0 border-2 border-border flex items-center justify-center font-serif text-3xl text-ink mb-6 shadow-sm"
                                >
                                    {step.num}
                                </motion.div>
                                <h3 className="font-serif text-2xl text-ink mb-2">{step.title}</h3>
                                <p className="text-sm text-ink-faint max-w-xs">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Animated Stats */}
            <section className="py-24 px-6 max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    <AnimatedCounter value="12" suffix="+" label="Features" />
                    <AnimatedCounter value="2" prefix="<" suffix="s" label="Load Time" />
                    <AnimatedCounter value="100" suffix="%" label="Private" />
                    <AnimatedCounter value="∞" label="Offline Ready" />
                </div>
            </section>

            {/* 8. Comparison Table */}
            <section className="py-24 px-6 max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="font-serif text-3xl text-ink">Why Knowledge Hub?</h2>
                </div>
                <div className="card overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-border bg-surface-2/50">
                                <th className="p-4 font-mono text-xs uppercase tracking-widest text-ink-muted font-medium">Feature</th>
                                <th className="p-4 font-serif text-lg text-accent bg-accent/5">Knowledge Hub</th>
                                <th className="p-4 font-serif text-lg text-ink-ghost">Notion</th>
                                <th className="p-4 font-serif text-lg text-ink-ghost">Obsidian</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                ['AI Chat with Notes', <Check size={18} className="text-accent" />, <Check size={18} className="text-ink-muted" />, 'Plugin'],
                                ['Knowledge Graph', <Check size={18} className="text-accent" />, <X size={18} className="text-ink-ghost/30" />, <Check size={18} className="text-ink-muted" />],
                                ['Offline-First', <Check size={18} className="text-accent" />, <X size={18} className="text-ink-ghost/30" />, <Check size={18} className="text-ink-muted" />],
                                ['Self-Hostable', <Check size={18} className="text-accent" />, <X size={18} className="text-ink-ghost/30" />, <X size={18} className="text-ink-ghost/30" />],
                                ['Free & Open', <Check size={18} className="text-accent" />, 'Freemium', 'Freemium'],
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                                    <td className="p-4 text-ink-muted font-medium">{row[0]}</td>
                                    <td className="p-4 bg-accent/5 flex items-center">{row[1]}</td>
                                    <td className="p-4 text-ink-faint">{row[2]}</td>
                                    <td className="p-4 text-ink-faint">{row[3]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 9. FAQ Accordion */}
            <section id="faq" className="py-24 px-6 max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="font-serif text-3xl text-ink">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { q: "Is it really free?", a: "Yes. Knowledge Hub is an open-source project designed to be self-hosted. There are no paywalls, subscriptions, or premium tiers." },
                        { q: "Where is my data stored?", a: "Your data lives on your own configured PostgreSQL database (like Neon, Supabase, or local). The app doesn't phone home or share your data." },
                        { q: "Can I use it offline?", a: "Absolutely. Once loaded, the PWA caches your app shell and uses IndexedDB to store your notes locally. Changes sync when you go back online." },
                        { q: "What AI model does it use?", a: "By default, it uses the LLaMA 3.3 70B model via Groq's API for blazing-fast, free-tier friendly inference." },
                        { q: "Can I export my data?", a: "Yes. You have total data sovereignty. One click in the settings exports your entire workspace to a JSON payload or Markdown files." }
                    ].map((faq, i) => {
                        const [open, setOpen] = useState(false);
                        return (
                            <div key={i} className="card overflow-hidden">
                                <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-2 transition-colors">
                                    <span className="font-serif text-lg text-ink">{faq.q}</span>
                                    <ChevronDown className={`transition-transform duration-300 text-ink-muted ${open ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {open && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 pt-1 text-ink-faint text-sm leading-relaxed">
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 10. Final CTA */}
            <section className="py-32 px-6 max-w-4xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    className="card p-12 md:p-20 text-center backdrop-blur-xl bg-surface-1/80 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 border-[2px] border-transparent bg-[linear-gradient(90deg,var(--border),var(--accent),var(--border))] bg-[length:200%_100%] animate-[shimmer_4s_infinite_linear] opacity-30 mask-composite"></div>
                    <h2 className="font-serif text-4xl md:text-5xl text-ink mb-6 relative z-10">Ready to think better?</h2>
                    <p className="text-ink-faint text-lg mb-10 max-w-lg mx-auto relative z-10">
                        Join Knowledge Hub — your private, AI-powered second brain. Organize your life today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <Link to="/register" className="btn-primary px-10 py-4 text-lg shadow-xl shadow-accent/20">Create Free Account</Link>
                    </div>
                </motion.div>
            </section>

            {/* 11. Full-Width Footer */}
            <footer className="border-t border-border bg-surface-1/50 backdrop-blur-md pt-16 pb-8 px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-accent text-accent-ink font-bold text-xs">K</div>
                                <span className="font-serif text-lg text-ink tracking-tight">knowledge hub</span>
                            </div>
                            <p className="text-xs text-ink-faint mb-6 leading-relaxed">A secure, open-source personal knowledge management system powered by AI.</p>
                            <button onClick={toggleTheme} className="flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                        </div>
                        
                        <div>
                            <h4 className="font-mono text-xs uppercase tracking-widest text-ink mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-ink-faint">
                                <li><button onClick={() => scrollTo('features')} className="hover:text-accent transition-colors">Features</button></li>
                                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-accent transition-colors">How It Works</button></li>
                                <li><button onClick={() => scrollTo('faq')} className="hover:text-accent transition-colors">FAQ</button></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-mono text-xs uppercase tracking-widest text-ink mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-ink-faint">
                                <li><span className="hover:text-accent transition-colors cursor-pointer">Documentation</span></li>
                                <li><span className="hover:text-accent transition-colors cursor-pointer">API Reference</span></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-mono text-xs uppercase tracking-widest text-ink mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm text-ink-faint">
                                <li><span className="hover:text-accent transition-colors cursor-pointer">Privacy Policy</span></li>
                                <li><span className="hover:text-accent transition-colors cursor-pointer">Terms of Service</span></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="font-mono text-2xs text-ink-ghost tracking-wider">© {new Date().getFullYear()} Knowledge Hub. Built with ☕ and curiosity.</p>
                        <p className="font-mono text-2xs text-ink-ghost tracking-wider">v1.0</p>
                    </div>
                </div>
            </footer>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 2rem)); }
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes drift {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(30px, -30px); }
                }
            `}} />
        </div>
    );
}
