import { motion } from "framer-motion";

const IconHeart = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
    </svg>
);

const IconSparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export default function LandingPage({ onStart }) {
    return (
        <div className="min-h-screen bg-[#fff7fb] text-rose-950 font-sans selection:bg-rose-200">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/40 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-100/60 blur-[120px] rounded-full" />

                {/* Floating Hearts */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0.2, 0.4, 0.2],
                            scale: [1, 1.2, 1],
                            x: [0, 20, 0],
                            y: [0, -20, 0]
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className="absolute text-rose-300/40"
                        style={{
                            top: `${Math.random() * 80 + 10}%`,
                            left: `${Math.random() * 80 + 10}%`
                        }}
                    >
                        <IconHeart className="w-8 h-8" />
                    </motion.div>
                ))}
            </div>

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-white/30 border-b border-rose-100">
                <div className="flex items-center gap-2 font-display font-bold text-xl text-rose-600">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                        <IconHeart className="w-5 h-5" />
                    </div>
                    <span>Invite</span>
                </div>
                <button
                    onClick={onStart}
                    className="px-5 py-2 rounded-full bg-rose-500 text-white font-semibold text-sm shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                >
                    Start Creating
                </button>
            </nav>

            <main className="relative z-10 pt-32 pb-20 px-6">
                {/* Hero Section */}
                <div className="max-w-4xl mx-auto text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <IconSparkles />
                        <span>Making every moment count</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-8 text-rose-950 leading-[1.1]"
                    >
                        Every small thing makes us feel <span className="text-rose-500 relative">
                            happy
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" className="text-rose-200" />
                            </svg>
                        </span>.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-rose-900/60 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        That small "good night" text, the "how are you" check-up... these gestures touch our hearts. Why should invites be normal and boring? We make them truly special.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <button
                            onClick={onStart}
                            className="px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/40 transition-all hover:scale-[1.02] active:scale-95 text-lg"
                        >
                            Create Your Special Invite
                        </button>
                    </motion.div>
                </div>

                {/* How it Works / Social Proof Section */}
                <div className="max-w-6xl mx-auto mb-40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StepCard
                            number="01"
                            title="Paste or Type"
                            description="Simply paste your booking confirmation or type your event details."
                            icon={<IconPlus />}
                        />
                        <StepCard
                            number="02"
                            title="Customize Vibe"
                            description="Personalize with custom cards, notes, and stunning imagery."
                            icon={<IconHeart className="w-6 h-6" />}
                        />
                        <StepCard
                            number="03"
                            title="Share Magic"
                            description="Send a beautiful stack experience that makes them feel special."
                            icon={<IconSparkles />}
                        />
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/40 border border-white/60 backdrop-blur-xl rounded-[40px] p-8 md:p-16 shadow-2xl shadow-rose-500/5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-rose-950 mb-6">
                                    Personalization that matters.
                                </h2>
                                <div className="space-y-6">
                                    <FeatureItem
                                        title="Truly Personalized"
                                        text="Add your own matter, your own voice, and make them feel seen."
                                    />
                                    <FeatureItem
                                        title="Modern Gestures"
                                        text="Ditch the plain text bubbles. Send an invite that reflects your care."
                                    />
                                    <FeatureItem
                                        title="Effortless Magic"
                                        text="Our smart parser turns messy confirmation texts into digital beauty."
                                    />
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                {/* Mockup or Visual */}
                                <div className="w-full max-w-[280px] aspect-[9/16] bg-rose-50 rounded-[40px] border-8 border-white shadow-2xl relative overflow-hidden flex items-center justify-center">
                                    <div className="p-6 text-center">
                                        <div className="w-16 h-16 rounded-full bg-rose-200/50 mx-auto mb-4 flex items-center justify-center">
                                            <IconHeart className="w-8 h-8 text-rose-400" />
                                        </div>
                                        <div className="h-4 w-24 bg-rose-200/50 rounded-full mx-auto mb-2" />
                                        <div className="h-3 w-32 bg-rose-100 mx-auto rounded-full" />
                                    </div>
                                </div>
                                {/* Floating decor */}
                                <div className="absolute top-10 -right-4 w-20 h-20 bg-pink-200/30 blur-2xl rounded-full" />
                                <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-rose-200/30 blur-2xl rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="max-w-4xl mx-auto text-center mt-40">
                    <h3 className="text-3xl font-display font-bold text-rose-950 mb-8">
                        Ready to change how you invite?
                    </h3>
                    <button
                        onClick={onStart}
                        className="px-8 py-4 bg-rose-950 text-white font-bold rounded-2xl shadow-lg hover:bg-rose-900 transition-all active:scale-95"
                    >
                        Start for Free
                    </button>
                </div>
            </main>

            <footer className="py-12 px-6 border-t border-rose-100 flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 font-display font-bold text-rose-400">
                    <IconHeart className="w-5 h-5" />
                    <span>Invite</span>
                </div>
                <p className="text-rose-400/60 text-sm">
                    Built for moments that matter.
                </p>
            </footer>
        </div>
    );
}

function StepCard({ number, title, description, icon }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="p-8 rounded-[32px] bg-white border border-rose-100 shadow-xl shadow-rose-500/5 transition-all"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-4xl font-display font-black text-rose-100">{number}</span>
            </div>
            <h3 className="text-xl font-bold text-rose-950 mb-3">{title}</h3>
            <p className="text-rose-900/50 leading-relaxed text-sm">{description}</p>
        </motion.div>
    );
}

function FeatureItem({ title, text }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1">
                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
            </div>
            <div>
                <h4 className="font-bold text-rose-950 text-lg mb-1">{title}</h4>
                <p className="text-rose-900/50 text-sm leading-relaxed">{text}</p>
            </div>
        </div>
    );
}
