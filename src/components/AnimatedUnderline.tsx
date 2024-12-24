import { motion, type ValueAnimationTransition } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface UnderlineProps {
  label: string;
  className?: string;
  transition?: ValueAnimationTransition;
  onClick?: () => void;
  underlineHeightRatio?: number;
  underlinePaddingRatio?: number;
  disabled?: boolean;
  alwaysShowOnMobile?: boolean;
}

const CenterUnderline = ({
  label,
  className,
  onClick,
  transition = { duration: 0.25, ease: "easeInOut" },
  underlineHeightRatio = 0.1, // Default to 10% of font size
  underlinePaddingRatio = 0.01, // Default to 1% of font size
  alwaysShowOnMobile = false,
  ...props
}: UnderlineProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateUnderlineStyles = () => {
      if (textRef.current) {
        const fontSize = parseFloat(getComputedStyle(textRef.current).fontSize);
        const underlineHeight = fontSize * underlineHeightRatio;
        const underlinePadding = fontSize * underlinePaddingRatio;
        textRef.current.style.setProperty(
          "--underline-height",
          `${underlineHeight}px`,
        );
        textRef.current.style.setProperty(
          "--underline-padding",
          `${underlinePadding}px`,
        );
      }
    };

    const checkMobile = () => {
      // Using a media query to detect touch devices
      setIsMobile(window.matchMedia("(hover: none)").matches);
    };

    updateUnderlineStyles();
    checkMobile();
    window.addEventListener("resize", updateUnderlineStyles);
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", updateUnderlineStyles);
      window.removeEventListener("resize", checkMobile);
    };
  }, [underlineHeightRatio, underlinePaddingRatio]);

  const underlineVariants = {
    hidden: {
      width: alwaysShowOnMobile && isMobile ? "100%" : 0,
      originX: 0.5,
    },
    visible: {
      width: "100%",
      transition: transition,
    },
  };

  return (
    <motion.span
      className={`relative inline-block cursor-pointer ${className}`}
      whileHover="visible"
      initial="hidden"
      {...(alwaysShowOnMobile && isMobile ? { animate: "visible" } : {})}
      onClick={onClick}
      ref={textRef}
      {...props}
    >
      <span>{label}</span>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bg-current"
        style={{
          height: "var(--underline-height)",
          bottom: "calc(-1 * var(--underline-padding))",
        }}
        variants={underlineVariants}
      />
    </motion.span>
  );
};

export default CenterUnderline;
