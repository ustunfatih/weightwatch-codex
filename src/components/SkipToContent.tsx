export const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--accent-2)] focus:text-white focus:font-semibold focus:rounded-xl focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
};
