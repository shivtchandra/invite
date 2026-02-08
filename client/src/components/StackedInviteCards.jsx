import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80";

const CARD_CONFIGS = [
  { scale: 1, rotate: 0, zIndex: 50 },
  { scale: 0.96, rotate: -1.5, zIndex: 40 },
  { scale: 0.92, rotate: 2, zIndex: 30 },
  { scale: 0.88, rotate: -1, zIndex: 20 },
  { scale: 0.84, rotate: 1.5, zIndex: 10 },
];

const lineReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function StackedInviteCards({ invite, calendarUrl, shareUrl }) {
  const [currentCard, setCurrentCard] = useState(0);
  const containerRef = useRef(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 120, damping: 20 });

  const rotateX = useTransform(springY, [-40, 40], [5, -5]);
  const rotateY = useTransform(springX, [-40, 40], [-5, 5]);

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    pointerX.set(x / 10);
    pointerY.set(y / 10);
  }

  function resetTilt() {
    pointerX.set(0);
    pointerY.set(0);
  }

  // Trigger confetti when reaching the final card
  useEffect(() => {
    if (currentCard === 4 && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);

      // Multiple confetti bursts for celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#fb7185', '#f43f5e', '#fda4af', '#fbbf24', '#a78bfa'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [currentCard, hasTriggeredConfetti]);

  // Scroll/wheel handler with slower threshold
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout = null;
    let accumulatedDelta = 0;
    const SCROLL_THRESHOLD = 80; // Require more scroll to advance

    function handleWheel(event) {
      event.preventDefault();

      accumulatedDelta += Math.abs(event.deltaY);

      if (accumulatedDelta < SCROLL_THRESHOLD) {
        return;
      }

      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        accumulatedDelta = 0;
      }, 800); // Longer cooldown for slower feel

      if (event.deltaY > 0 && currentCard < 4) {
        setCurrentCard((prev) => prev + 1);
        accumulatedDelta = 0;
      } else if (event.deltaY < 0 && currentCard > 0) {
        setCurrentCard((prev) => prev - 1);
        accumulatedDelta = 0;
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [currentCard]);

  // Touch swipe support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;

    function handleTouchStart(event) {
      startY = event.touches[0].clientY;
    }

    function handleTouchEnd(event) {
      const endY = event.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 60) {
        if (diff > 0 && currentCard < 4) {
          setCurrentCard((prev) => prev + 1);
        } else if (diff < 0 && currentCard > 0) {
          setCurrentCard((prev) => prev - 1);
        }
      }
    }

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentCard]);

  const cards = [
    // Card 1: Welcome
    {
      id: "welcome",
      content: (
        <div className="flex h-full flex-col items-center justify-center text-center px-4">
          <motion.div
            className="text-6xl mb-4"
            initial="hidden"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            👋
          </motion.div>
          <motion.h2
            className="font-display text-4xl font-bold text-rose-950 mb-3"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.25}
          >
            Hey there!
          </motion.h2>
          <motion.p
            className="text-base text-rose-600 mb-6"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.4}
          >
            We've got something special planned
          </motion.p>
          <motion.div
            className="flex flex-col items-center gap-2"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.55}
          >
            <p className="text-sm text-rose-500">Scroll to reveal</p>
            <motion.div
              className="text-rose-400"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      )
    },
    // Card 2: Timings
    {
      id: "timings",
      content: (
        <div className="flex h-full flex-col items-center justify-center text-center px-6">
          <motion.div
            className="mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 p-4"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <motion.p
            className="card-kicker mb-2"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            Save the date
          </motion.p>
          <motion.h2
            className="font-display text-3xl font-bold text-rose-950 mb-6"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            {invite.timeLabel || "Tonight · 8:00 PM"}
          </motion.h2>
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.45}
          >
            <svg className="h-4 w-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-sm font-medium text-rose-700">
              {invite.peopleGoing || "A few"} people coming
            </span>
          </motion.div>
        </div>
      )
    },
    // Card 3: You're Invited + Image
    {
      id: "invited",
      content: (
        <div className="flex h-full flex-col justify-between">
          <motion.div
            className="relative h-56 w-full overflow-hidden rounded-2xl"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <img
              src={invite.imageUrl || FALLBACK_IMAGE}
              alt={invite.restaurantName || "Restaurant"}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 to-transparent" />
          </motion.div>
          <div className="flex flex-1 flex-col items-center justify-center text-center py-6">
            <motion.p
              className="card-kicker mb-2"
              variants={lineReveal}
              initial="hidden"
              animate="visible"
              custom={0.25}
            >
              You are
            </motion.p>
            <motion.h2
              className="font-display text-5xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent"
              variants={lineReveal}
              initial="hidden"
              animate="visible"
              custom={0.35}
            >
              Invited
            </motion.h2>
          </div>
        </div>
      )
    },
    // Card 4: Venue Reveal
    {
      id: "venue",
      content: (
        <div className="flex h-full flex-col items-center justify-center text-center px-6">
          <motion.div
            className="mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 p-4"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.div>
          <motion.p
            className="card-kicker mb-3"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            The place
          </motion.p>
          <motion.h2
            className="font-display text-4xl font-bold leading-tight text-rose-950 mb-4"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            {invite.restaurantName || "Restaurant"}
          </motion.h2>
          <motion.p
            className="text-base text-rose-700 mb-2"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.42}
          >
            {invite.location || "Location TBA"}
          </motion.p>
          <motion.div
            className="flex items-center gap-2 text-sm text-rose-500"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.54}
          >
            <span>{invite.cuisine || "Dining"}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{invite.rating || "NA"}</span>
            </div>
          </motion.div>
        </div>
      )
    },
    // Card 5: CTA
    {
      id: "cta",
      content: (
        <div className="flex h-full flex-col items-center justify-center text-center px-6">
          <motion.div
            className="text-5xl mb-4"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            🎉
          </motion.div>
          <motion.p
            className="card-kicker mb-2"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            So...
          </motion.p>
          <motion.h2
            className="font-display text-3xl font-bold text-rose-950 mb-4"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            Can we count you in?
          </motion.h2>
          <motion.p
            className="text-sm text-rose-600 mb-6 max-w-xs"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.4}
          >
            {invite.note || "This one's worth showing up for."}
          </motion.p>
          <motion.div
            className="grid w-full gap-3"
            variants={lineReveal}
            initial="hidden"
            animate="visible"
            custom={0.52}
          >
            <a
              className="action-btn action-btn-secondary"
              href={invite.swiggyUrl || "#"}
              target="_blank"
              rel="noreferrer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Menu
            </a>
            <a
              className="action-btn action-btn-secondary"
              href={calendarUrl || "#"}
              target="_blank"
              rel="noreferrer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add to Calendar
            </a>
            <a
              className="action-btn action-btn-primary"
              href={shareUrl}
              onClick={(e) => {
                // Trigger extra confetti on click
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#fb7185', '#f43f5e', '#fda4af', '#fbbf24', '#a78bfa']
                });
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              I'm in!
            </a>
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <motion.div
        ref={containerRef}
        className="stack-stage"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handlePointerMove}
        onMouseLeave={resetTilt}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const relativeIndex = index - currentCard;

            if (relativeIndex < 0 || relativeIndex > 4) return null;

            const config = CARD_CONFIGS[relativeIndex] || CARD_CONFIGS[4];

            return (
              <motion.article
                key={card.id}
                className="stack-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: relativeIndex === 0 ? 1 : 0.85 - relativeIndex * 0.15,
                  scale: config.scale,
                  rotate: config.rotate,
                  zIndex: config.zIndex
                }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{ height: "420px" }}
              >
                <div className="flex h-full flex-col">
                  {card.content}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Progress dots */}
      <div className="mt-4 flex items-center justify-center gap-3 w-full">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentCard(index)}
            className={`h-2.5 rounded-full transition-all duration-500 ${index === currentCard
              ? "w-8 bg-gradient-to-r from-rose-500 to-pink-500"
              : "w-2.5 bg-rose-300 hover:bg-rose-400"
              }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
