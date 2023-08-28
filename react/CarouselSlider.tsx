import React, { useEffect, useRef, useState, useMemo, ReactChildren } from "react";
import { Link, canUseDOM } from "vtex.render-runtime";

// Styles
import styles from "./styles.css";

interface CarouselSliderProps {
  children: ReactChildren | any
  pauseOnHover: boolean
  autoFlip: boolean
  maximumCycles: number
  secondsBetweenFlips: number
  showDots: boolean
  blockClass: string
}

const minimumFlipSeconds = 3;
const intersectionThreshold = 0.5;

const CarouselSlider: StorefrontFunctionComponent<CarouselSliderProps> = ({ blockClass, children, autoFlip, maximumCycles, pauseOnHover, secondsBetweenFlips, showDots }) => {
  const carouselApp = useRef<any>();
  const train = useRef<any>();
  const appTimer = useRef<any>();
  const numberOfFlips = useRef(0);

  const [hoverPause, setHoverPause] = useState(false);
  const [viewPause, setViewPause] = useState(false);
  const [loopFlag, setLoopFlag] = useState(false);
  const [mouseNavVersion, setMouseNavVersion] = useState(true);
  const [trainPosition, setTrainPosition] = useState(0);
  const [activeCar, setActiveCar] = useState(0);

  const maximumFlips = useMemo(() => children.length * (maximumCycles || 10), []);
  const flipDuration = useMemo(() => (secondsBetweenFlips < minimumFlipSeconds ? minimumFlipSeconds : secondsBetweenFlips) * 1000, []);

  useEffect(() => {
    // If autoFlip is off or if a keyboard user has navigated to the carousel, clear timer. - LM
    if (!autoFlip || !mouseNavVersion) {
      clearInterval(appTimer.current);
      return;
    }

    // We don't want the carousel to run infinitely if a user walks away.
    // advanceTrain increments a counter and here we check if the count
    // exceeds the maximum. The handleDotClick function will reset the count. - LM 
    if (maximumFlips > 0 && numberOfFlips.current >= maximumFlips) {
      clearInterval(appTimer.current);
      return;
    }

    appTimer.current = setInterval(() => {
      if (viewPause) return;
      if (pauseOnHover) {
        if (!hoverPause) advanceTrain();
      } else {
        advanceTrain();
      }
    }, flipDuration);

    return () => {
      clearInterval(appTimer.current);
    }
  });

  useEffect(() => {
    if (!autoFlip) return;

    const intersectionObserver = new IntersectionObserver(intersectingCallback, { threshold: intersectionThreshold });
    intersectionObserver.observe(carouselApp.current);

    return () => intersectionObserver.disconnect();
  }, []);

  // If carousel visibility is less than intersectionThreshold, pause autoFlip. - LM
  const intersectingCallback = (carousel: any) => {
    const isVisible = carousel[0].isIntersecting;
    setViewPause(!isVisible);
  }

  // Side effect for activeCar update gets current width of 
  // window in event the user has resized their browser - LM
  useEffect(() => {
    if (!canUseDOM) return;

    const windowWidth = window.innerWidth;
    setTrainPosition(0 - (windowWidth * activeCar));
  }, [activeCar]);

  useEffect(() => {
    train.current?.addEventListener("transitionend", handleTrainStop);
    return () => train.current?.removeEventListener("transitionend", handleTrainStop);
  }, [activeCar]);

  // If activeCar is the duplicate first car, inactivate
  // transition property, snap to 0px and re-activate transition. - LM
  const handleTrainStop = () => {
    if (activeCar >= children.length) {
      setLoopFlag(true);
      setActiveCar(0);

      // Wait for render.
      setTimeout(() => setLoopFlag(false), 250);
    }
  }

  const advanceTrain = () => {
    numberOfFlips.current = numberOfFlips.current + 1;
    setActiveCar(activeCar + 1);
  }

  const handleDotClick = (e: any) => {
    const clickedDot = Number(e.target.dataset.number);
    setActiveCar(clickedDot);
    numberOfFlips.current = 0;
  }

  const hoverPauseTimer = () => {
    setHoverPause(true);
  }

  const resumeAppTimer = () => {
    setHoverPause(false);
  }

  // When a keyboard user navigates to a <HideCarouselButton /> button,
  // the carousel will be turned off and the content will stack in an overflow
  // panel that is easier to navigate for a keyboard user. Then will focus the 
  // first or final link in the list depending on navigation direction. - LM
  const setToKeyboardNav = (props: any) => {
    setMouseNavVersion(false);

    // Wait for render.
    setTimeout(() => {
      if (props.top) train.current.scrollTop = 0;

      const allLinks = train.current.querySelectorAll("a");
      const firstLink = allLinks[0];
      const finalLink = allLinks[allLinks.length - 1];

      if (props.top && firstLink) {
        firstLink.focus();
      }

      if (props.bottom && finalLink) {
        finalLink.focus();
      }

    }, 1);
  }

  const HideCarouselButton = (props: any) => (
    <button data-sr-only={mouseNavVersion} onFocus={() => setToKeyboardNav(props)} aria-hidden="true">
      Switch List To Keyboard Friendly Navigation on Focus
    </button>
  );

  return (
    <section ref={carouselApp}
      onMouseEnter={hoverPauseTimer}
      onMouseLeave={resumeAppTimer}
      aria-labelledby="featuredContentTitle"
      data-stack-content={mouseNavVersion ? "false" : "true"}
      className={`${styles.container}--${blockClass}`}>

      <h2 id="featuredContentTitle" className={`${styles.srFeaturedTitle}--${blockClass}`}>Featured Links</h2>

      {mouseNavVersion && <HideCarouselButton top />}

      <div className={`${styles.container}--${blockClass}`}>
        <div className={`${styles.tracks}--${blockClass}`}>
          <ul
            ref={train}
            tabIndex={-1}
            aria-labelledby="featuredContentTitle"
            style={{ transform: mouseNavVersion ? `translateX(${trainPosition}px)` : "none" }}
            data-loop={loopFlag}
            className={`${styles.train}--${blockClass}`}>

            {children.map((child: any, index: number) => (
              <li key={`car-${index}`} className={`${styles.car}--${blockClass}`}>{child}</li>
            ))}

            {mouseNavVersion &&
              <li aria-hidden="true" data-duplicate-first-car className={`${styles.car}--${blockClass}`}>
                {children[0]}
              </li>}

          </ul>
        </div>

        {showDots && mouseNavVersion &&
          <div className={`${styles.dotsContainer}--${blockClass}`}>
            {children.map((child: any, index: number) => (
              <button
                key={child.props.id}
                tabIndex={-1}
                aria-hidden="true"
                data-number={index}
                data-active-dot={activeCar === index ? "true" : "false"}
                onClick={handleDotClick}
                className={`${styles.dot}--${blockClass}`} ></button>
            ))}
          </div>}
      </div>

      {mouseNavVersion && <HideCarouselButton bottom />}
    </section>
  );
};

CarouselSlider.schema = {
  title: "CarouselSlider",
  description: "",
  type: "object",
  properties: {
    autoFlip: {
      title: "Auto Flip?",
      type: "boolean"
    },
    pauseOnHover: {
      title: "Pause on Mouse Hover?",
      type: "boolean"
    },
    showDots: {
      title: "Show Pagination Dots?",
      type: "boolean"
    },
    secondsBetweenFlips: {
      title: "Seconds Between Flips",
      type: "number"
    },
    maximumCycles: {
      title: "Maximum Cycles",
      description: "Set to 0 for infinite.",
      default: 0,
      type: "number"
    }
  }
};

export default CarouselSlider;
